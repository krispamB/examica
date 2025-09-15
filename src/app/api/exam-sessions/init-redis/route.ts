import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getExamStorage } from '@/lib/redis/exam-storage'

interface InitRedisRequest {
  sessionId: string
  examId: string
  timeLimit: number
}

export async function POST(request: NextRequest) {
  try {
    const body: InitRedisRequest = await request.json()
    const { sessionId, examId, timeLimit } = body

    if (!sessionId || !examId || !timeLimit) {
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
      .select('id, user_id, exam_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    if (session.exam_id !== examId) {
      return NextResponse.json({ error: 'Exam ID mismatch' }, { status: 400 })
    }

    // Initialize Redis session
    const examStorage = getExamStorage()
    const result = await examStorage.initExamSession(
      sessionId,
      examId,
      timeLimit
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to initialize Redis session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Redis session initialized successfully',
    })
  } catch (error) {
    console.error('Initialize Redis session API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
