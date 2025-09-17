import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createExamSessionService } from '@/lib/exam-sessions/service'

interface Context {
  params: Promise<{
    sessionId: string
  }>
}

interface BatchResponseRequest {
  responses: {
    questionId: string
    response: unknown
    timestamp?: number
    hash?: string
  }[]
}

interface BatchResponseResult {
  success: boolean
  processed: number
  failed: number
  errors: Array<{
    questionId: string
    error: string
  }>
  duplicates: number
}

// POST /api/exam-sessions/[sessionId]/batch-responses - Submit multiple responses
export async function POST(request: NextRequest, context: Context) {
  const { sessionId } = await context.params
  try {
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

    // Only students can submit responses
    if (userProfile.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can submit responses' },
        { status: 403 }
      )
    }

    const body: BatchResponseRequest = await request.json()

    // Validate required fields
    if (!body.responses || !Array.isArray(body.responses)) {
      return NextResponse.json(
        { error: 'Responses array is required' },
        { status: 400 }
      )
    }

    if (body.responses.length === 0) {
      return NextResponse.json(
        { error: 'At least one response is required' },
        { status: 400 }
      )
    }

    // Validate each response
    for (const response of body.responses) {
      if (!response.questionId) {
        return NextResponse.json(
          { error: 'Question ID is required for all responses' },
          { status: 400 }
        )
      }

      if (response.response === undefined || response.response === null) {
        return NextResponse.json(
          { error: `Response is required for question ${response.questionId}` },
          { status: 400 }
        )
      }
    }

    const examSessionService = createExamSessionService()

    // Verify session belongs to current user and is active
    const sessionResult = await examSessionService.getExamSession(sessionId)
    if (!sessionResult.success || !sessionResult.session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (sessionResult.session.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (sessionResult.session.status !== 'active') {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      )
    }

    // Process responses in batch with transaction
    const result = await processBatchResponses(
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
    console.error('Batch submit responses API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

async function processBatchResponses(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
  userId: string,
  responses: BatchResponseRequest['responses']
): Promise<BatchResponseResult> {
  const result: BatchResponseResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: [],
    duplicates: 0,
  }

  // Start transaction
  try {
    // Get existing responses to check for duplicates
    const { data: existingResponses, error: fetchError } = await supabase
      .from('question_responses')
      .select('question_id, updated_at')
      .eq('session_id', sessionId)
      .in(
        'question_id',
        responses.map((r) => r.questionId)
      )

    if (fetchError) {
      throw new Error(
        `Failed to fetch existing responses: ${fetchError.message}`
      )
    }

    const existingMap = new Map(
      existingResponses?.map((r) => [
        r.question_id,
        r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),
      ]) || []
    )

    // Get questions data for evaluation
    const questionIds = responses.map((r) => r.questionId)
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, type, correct_answer, options, points')
      .in('id', questionIds)

    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`)
    }

    const questionsMap = new Map(questions?.map((q) => [q.id, q]) || [])

    // Process each response
    const responsesToUpsert = []
    const responsesToUpdate = []

    for (const response of responses) {
      try {
        const question = questionsMap.get(response.questionId)
        if (!question) {
          result.errors.push({
            questionId: response.questionId,
            error: 'Question not found',
          })
          result.failed++
          continue
        }

        // Check for duplicates based on timestamp
        const existingTimestamp = existingMap.get(response.questionId)
        const responseTimestamp = response.timestamp || Date.now()

        if (existingTimestamp && responseTimestamp <= existingTimestamp) {
          result.duplicates++
          continue
        }

        // Evaluate the answer
        const evaluation = evaluateAnswer(response.response, question)

        const responseData = {
          session_id: sessionId,
          question_id: response.questionId,
          user_id: userId,
          response: response.response as any,
          is_correct: evaluation.isCorrect,
          points_earned: evaluation.pointsEarned,
          time_spent: null, // Could be calculated from timestamps
          updated_at: new Date().toISOString(),
        }

        if (existingTimestamp) {
          responsesToUpdate.push(responseData)
        } else {
          responsesToUpsert.push({
            ...responseData,
            created_at: new Date().toISOString(),
          })
        }

        result.processed++
      } catch (error) {
        result.errors.push({
          questionId: response.questionId,
          error: error instanceof Error ? error.message : 'Processing failed',
        })
        result.failed++
      }
    }

    // Batch insert new responses
    if (responsesToUpsert.length > 0) {
      const { error: insertError } = await supabase
        .from('question_responses')
        .insert(responsesToUpsert)

      if (insertError) {
        throw new Error(`Failed to insert responses: ${insertError.message}`)
      }
    }

    // Batch update existing responses
    for (const updateData of responsesToUpdate) {
      const { error: updateError } = await supabase
        .from('question_responses')
        .update(updateData)
        .eq('session_id', sessionId)
        .eq('question_id', updateData.question_id)

      if (updateError) {
        console.error(
          `Failed to update response for ${updateData.question_id}:`,
          updateError
        )
        result.errors.push({
          questionId: updateData.question_id,
          error: 'Failed to update response',
        })
        result.failed++
        result.processed--
      }
    }

    result.success = result.failed === 0
  } catch (error) {
    console.error('Batch processing error:', error)
    throw error
  }

  return result
}

function evaluateAnswer(
  response: unknown,
  question: {
    type: string
    correct_answer: unknown
    options?: unknown
    points: number | null
  }
): { isCorrect: boolean | null; pointsEarned: number } {
  const questionPoints = question.points || 1

  const normalizeAnswer = (answer: unknown): string => {
    if (typeof answer === 'string') {
      return answer.toLowerCase().trim()
    }
    return String(answer || '')
      .toLowerCase()
      .trim()
  }

  switch (question.type) {
    case 'multiple_choice':
      const userAnswerArray = Array.isArray(response)
        ? response
        : [String(response)]
      const correctAnswerArray = Array.isArray(question.correct_answer)
        ? question.correct_answer.map(String)
        : [String(question.correct_answer)]

      const sortedUserAnswer = userAnswerArray.sort()
      const sortedCorrectAnswer = correctAnswerArray.sort()

      const isCorrect =
        JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer)

      return {
        isCorrect,
        pointsEarned: isCorrect ? questionPoints : 0,
      }

    case 'true_false':
    case 'fill_blank':
      const isCorrectText =
        normalizeAnswer(response) === normalizeAnswer(question.correct_answer)
      return {
        isCorrect: isCorrectText,
        pointsEarned: isCorrectText ? questionPoints : 0,
      }

    case 'essay':
    case 'matching':
      // These require manual grading
      return {
        isCorrect: null,
        pointsEarned: 0,
      }

    default:
      return {
        isCorrect: false,
        pointsEarned: 0,
      }
  }
}
