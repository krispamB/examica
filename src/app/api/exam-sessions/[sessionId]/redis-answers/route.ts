import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getExamStorage } from '@/lib/redis/exam-storage'

interface Context {
  params: Promise<{
    sessionId: string
  }>
}

// GET /api/exam-sessions/[sessionId]/redis-answers - Get answers from Redis
export async function GET(_request: NextRequest, context: Context) {
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

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    // Get answers from Redis
    const examStorage = getExamStorage()
    const result = await examStorage.getAllAnswers(sessionId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get answers from Redis' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      answers: result.answers || {},
    })
  } catch (error) {
    console.error('Get Redis answers API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
