import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Context {
  params: Promise<{
    sessionId: string
  }>
}

interface AutoSaveRequest {
  responses: {
    questionId: string
    response: unknown
    timestamp?: number
    hash?: string
  }[]
}

interface AutoSaveResult {
  success: boolean
  saved: number
  skipped: number
  errors: Array<{
    questionId: string
    error: string
  }>
  nextAutoSave: number // When next auto-save should happen
}

// POST /api/exam-sessions/[sessionId]/auto-save - Auto-save responses (non-blocking)
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

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Only students can auto-save responses
    if (userProfile.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can auto-save responses' },
        { status: 403 }
      )
    }

    const body: AutoSaveRequest = await request.json()

    // Validate required fields
    if (!body.responses || !Array.isArray(body.responses)) {
      return NextResponse.json(
        { error: 'Responses array is required' },
        { status: 400 }
      )
    }

    if (body.responses.length === 0) {
      return NextResponse.json({
        success: true,
        result: {
          success: true,
          saved: 0,
          skipped: 0,
          errors: [],
          nextAutoSave: Date.now() + 30000, // 30 seconds
        },
      })
    }

    // Verify session exists and belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('id, user_id, status, exam_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      )
    }

    // Process auto-save (non-blocking, best-effort)
    const result = await processAutoSave(
      supabase,
      sessionId,
      user.id,
      body.responses
    )

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Auto-save API error:', error)

    // For auto-save, we don't want to fail hard - return success with error info
    return NextResponse.json({
      success: false,
      result: {
        success: false,
        saved: 0,
        skipped: 0,
        errors: [
          {
            questionId: 'system',
            error:
              error instanceof Error ? error.message : 'Internal server error',
          },
        ],
        nextAutoSave: Date.now() + 60000, // Retry in 60 seconds
      },
    })
  }
}

async function processAutoSave(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
  userId: string,
  responses: AutoSaveRequest['responses']
): Promise<AutoSaveResult> {
  const result: AutoSaveResult = {
    success: true,
    saved: 0,
    skipped: 0,
    errors: [],
    nextAutoSave: Date.now() + 30000, // Default 30 seconds
  }

  try {
    // Get existing responses with timestamps to check for conflicts
    const questionIds = responses.map((r) => r.questionId)
    const { data: existingResponses } = await supabase
      .from('question_responses')
      .select('question_id, updated_at, response')
      .eq('session_id', sessionId)
      .in('question_id', questionIds)

    const existingMap = new Map(
      existingResponses?.map((r) => [
        r.question_id,
        {
          timestamp: r.updated_at
            ? new Date(r.updated_at).getTime()
            : Date.now(),
          response: r.response,
        },
      ]) || []
    )

    // Get question information for scoring (optional for auto-save)
    const { data: questions } = await supabase
      .from('questions')
      .select('id, type, correct_answer, options, points')
      .in('id', questionIds)

    const questionsMap = new Map(questions?.map((q) => [q.id, q]) || [])

    // Process each response
    for (const response of responses) {
      try {
        const existing = existingMap.get(response.questionId)
        const responseTimestamp = response.timestamp || Date.now()

        // Skip if we have newer data on server
        if (existing && responseTimestamp <= existing.timestamp) {
          // Check if the response is actually different
          if (
            JSON.stringify(existing.response) ===
            JSON.stringify(response.response)
          ) {
            result.skipped++
            continue
          }

          // There's a conflict - server has newer data but different content
          result.errors.push({
            questionId: response.questionId,
            error: 'Conflict detected - server has newer data',
          })
          result.skipped++
          continue
        }

        const question = questionsMap.get(response.questionId)
        let evaluation: { isCorrect: boolean | null; pointsEarned: number } = {
          isCorrect: null,
          pointsEarned: 0,
        }

        if (question) {
          evaluation = evaluateAnswerQuick(response.response, question)
        }

        const responseData = {
          session_id: sessionId,
          question_id: response.questionId,
          user_id: userId,
          response: response.response as any,
          is_correct: evaluation.isCorrect,
          points_earned: evaluation.pointsEarned,
          time_spent: null,
          updated_at: new Date().toISOString(),
        }

        if (existing) {
          // Update existing response
          const { error: updateError } = await supabase
            .from('question_responses')
            .update(responseData)
            .eq('session_id', sessionId)
            .eq('question_id', response.questionId)

          if (updateError) {
            result.errors.push({
              questionId: response.questionId,
              error: `Update failed: ${updateError.message}`,
            })
          } else {
            result.saved++
          }
        } else {
          // Insert new response
          const { error: insertError } = await supabase
            .from('question_responses')
            .insert({
              ...responseData,
              created_at: new Date().toISOString(),
            })

          if (insertError) {
            result.errors.push({
              questionId: response.questionId,
              error: `Insert failed: ${insertError.message}`,
            })
          } else {
            result.saved++
          }
        }
      } catch (error) {
        result.errors.push({
          questionId: response.questionId,
          error: error instanceof Error ? error.message : 'Processing failed',
        })
      }
    }

    // Adjust next auto-save based on success rate
    const totalAttempted = responses.length
    const successRate = totalAttempted > 0 ? result.saved / totalAttempted : 1

    if (successRate > 0.8) {
      result.nextAutoSave = Date.now() + 30000 // 30 seconds if mostly successful
    } else if (successRate > 0.5) {
      result.nextAutoSave = Date.now() + 45000 // 45 seconds if partially successful
    } else {
      result.nextAutoSave = Date.now() + 60000 // 60 seconds if mostly failed
    }

    result.success = result.errors.length < responses.length * 0.5 // Success if < 50% errors
  } catch (error) {
    console.error('Auto-save processing error:', error)
    result.success = false
    result.errors.push({
      questionId: 'system',
      error: error instanceof Error ? error.message : 'Processing failed',
    })
    result.nextAutoSave = Date.now() + 60000 // Retry in 60 seconds
  }

  return result
}

// Simplified evaluation for auto-save (performance optimized)
function evaluateAnswerQuick(
  response: unknown,
  question: {
    type: string
    correct_answer: unknown
    points: number | null
  }
): { isCorrect: boolean | null; pointsEarned: number } {
  const questionPoints = question.points || 1

  // For auto-save, we do basic evaluation to avoid expensive operations
  switch (question.type) {
    case 'multiple_choice':
      // Simple string comparison for auto-save
      const isCorrect =
        JSON.stringify(response) === JSON.stringify(question.correct_answer)
      return {
        isCorrect,
        pointsEarned: isCorrect ? questionPoints : 0,
      }

    case 'true_false':
    case 'fill_blank':
      const normalizeAnswer = (answer: unknown): string => {
        return String(answer || '')
          .toLowerCase()
          .trim()
      }

      const isCorrectText =
        normalizeAnswer(response) === normalizeAnswer(question.correct_answer)
      return {
        isCorrect: isCorrectText,
        pointsEarned: isCorrectText ? questionPoints : 0,
      }

    case 'essay':
    case 'matching':
      // These require manual grading - don't attempt to auto-score
      return {
        isCorrect: null,
        pointsEarned: 0,
      }

    default:
      return {
        isCorrect: null,
        pointsEarned: 0,
      }
  }
}
