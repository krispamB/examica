import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getExamStorage } from '@/lib/redis/exam-storage'
import { createExamSessionService } from '@/lib/exam-sessions/service'

interface Context {
  params: Promise<{
    sessionId: string
  }>
}

// POST /api/exam-sessions/[sessionId]/complete - Complete exam session
export async function POST(request: NextRequest, context: Context) {
  try {
    const { sessionId } = await context.params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify session ownership and get session details
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('id, user_id, exam_id, status, created_at, started_at')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    console.log(
      `Completion attempt for session ${sessionId} by user ${user.id}`
    )
    console.log('Session query result:', { session, sessionError })

    if (sessionError || !session) {
      console.error('Session not found:', {
        sessionError,
        sessionId,
        userId: user.id,
      })
      return NextResponse.json(
        {
          error: 'Session not found or access denied',
          debug: {
            sessionId,
            userId: user.id,
            sessionError: sessionError?.message,
          },
        },
        { status: 404 }
      )
    }

    // Check if session is still active - be more permissive
    const validStatuses = ['active', 'in_progress', 'paused']
    if (!validStatuses.includes(session.status)) {
      console.error('Invalid session status for completion:', {
        sessionId,
        status: session.status,
        validStatuses,
      })
      return NextResponse.json(
        {
          error: `Session status is '${session.status}', expected one of: ${validStatuses.join(', ')}`,
          debug: { sessionId, currentStatus: session.status, validStatuses },
          recoverable: true,
        },
        { status: 400 }
      )
    }

    // Get all answers from Redis
    const examStorage = getExamStorage()
    const answersResult = await examStorage.getAllAnswers(sessionId)

    console.log(`Redis answers retrieval result for session ${sessionId}:`, {
      success: answersResult.success,
      answerCount: answersResult.answers
        ? Object.keys(answersResult.answers).length
        : 0,
      error: answersResult.error,
    })

    if (!answersResult.success) {
      console.error('Failed to retrieve answers from Redis:', {
        sessionId,
        error: answersResult.error,
      })
      return NextResponse.json(
        {
          error: answersResult.error || 'Failed to retrieve answers from Redis',
          debug: { sessionId, redisError: answersResult.error },
          recoverable: true,
        },
        { status: 500 }
      )
    }

    const answers = answersResult.answers || {}
    console.log(
      `Retrieved ${Object.keys(answers).length} answers from Redis for session ${sessionId}`
    )

    // Start database transaction
    const examSessionService = createExamSessionService()

    try {
      // Submit all answers to database in batch
      if (Object.keys(answers).length > 0) {
        const responses = Object.entries(answers).map(
          ([questionId, answer]) => ({
            questionId,
            response: answer,
            timestamp: Date.now(), // Use current timestamp for batch submission
          })
        )

        console.log(
          `Submitting ${responses.length} responses to database for session ${sessionId}`
        )

        const batchResult = await examSessionService.submitMultipleResponses({
          sessionId,
          responses,
        })

        if (!batchResult.success) {
          throw new Error(
            batchResult.error || 'Failed to save responses to database'
          )
        }

        console.log(
          `Successfully saved ${batchResult.result?.processed || 0} responses to database`
        )

        // Verify responses were actually saved by querying the database
        const supabase = await createClient()
        const { data: savedResponses, error: verifyError } = await supabase
          .from('question_responses')
          .select('id, question_id')
          .eq('session_id', sessionId)

        if (verifyError) {
          console.error('Failed to verify saved responses:', verifyError)
        } else {
          console.log(
            `Verification: Found ${savedResponses?.length || 0} responses in database for session ${sessionId}`
          )

          // Ensure we have the expected number of responses
          if ((savedResponses?.length || 0) !== responses.length) {
            console.warn(
              `Response count mismatch: Expected ${responses.length}, found ${savedResponses?.length || 0}`
            )
          }
        }
      }

      // Complete the session (pass supabase client for result calculation)
      console.log(
        'DEBUG: Passing supabase client to completeExamSession. Client exists:',
        !!supabase
      )
      const completeResult = await examSessionService.completeExamSession(
        sessionId,
        supabase
      )

      if (!completeResult.success) {
        throw new Error(completeResult.error || 'Failed to complete session')
      }

      console.log(`Session ${sessionId} marked as completed successfully`)

      // Clear Redis session after successful completion
      await examStorage.clearSession(sessionId)

      return NextResponse.json({
        success: true,
        message: 'Exam completed successfully',
        result: completeResult.session,
      })
    } catch (error) {
      console.error('Transaction error during exam completion:', error)

      // If database operations fail, keep Redis data for recovery
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Failed to complete exam',
          recoverable: true, // Indicate that Redis data is still available
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Complete exam session API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
