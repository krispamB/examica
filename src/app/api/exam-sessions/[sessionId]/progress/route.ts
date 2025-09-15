import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createExamSessionService } from '@/lib/exam-sessions/service'

interface Context {
  params: Promise<{
    sessionId: string
  }>
}

// GET /api/exam-sessions/[sessionId]/progress - Get session progress
export async function GET(request: NextRequest, context: Context) {
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

    const examSessionService = createExamSessionService()

    // Get session to check ownership for students
    const sessionResult = await examSessionService.getExamSession(sessionId)
    if (!sessionResult.success || !sessionResult.session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Students can only access their own session progress
    if (
      userProfile.role === 'student' &&
      sessionResult.session.user_id !== user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await examSessionService.getSessionProgress(sessionId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      progress: result.progress,
    })
  } catch (error) {
    console.error('Get session progress API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
