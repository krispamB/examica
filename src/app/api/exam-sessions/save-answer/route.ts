import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getExamStorage } from '@/lib/redis/exam-storage'

interface SaveAnswerRequest {
  sessionId: string
  questionId: string
  answer: string | number | boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveAnswerRequest = await request.json()
    const { sessionId, questionId, answer } = body

    if (!sessionId || !questionId || answer === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('id, user_id, status')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    // Check if session is still active
    if (session.status !== 'active') {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      )
    }

    // Save answer to Redis
    const examStorage = getExamStorage()
    const result = await examStorage.saveAnswer(sessionId, questionId, answer)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save answer to Redis' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Answer saved successfully',
    })
  } catch (error) {
    console.error('Save answer to Redis API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
