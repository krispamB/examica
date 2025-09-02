import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createExamSessionService } from '@/lib/exam-sessions/service'

interface Context {
  params: {
    sessionId: string
  }
}

// GET /api/exam-sessions/[sessionId] - Get session details
export async function GET(request: NextRequest, context: Context) {
  try {
    const { sessionId } = context.params
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
    const result = await examSessionService.getExamSession(sessionId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    // Students can only access their own sessions
    if (userProfile.role === 'student' && result.session?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      session: result.session,
    })

  } catch (error) {
    console.error('Get exam session API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// PATCH /api/exam-sessions/[sessionId] - Update session status
export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { sessionId } = context.params
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

    const body = await request.json()
    const { action, reason } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    const examSessionService = createExamSessionService()

    // Get session to check ownership for students
    const sessionResult = await examSessionService.getExamSession(sessionId)
    if (!sessionResult.success || !sessionResult.session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Students can only update their own sessions
    if (userProfile.role === 'student' && sessionResult.session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    let result
    switch (action) {
      case 'complete':
        // Only students can complete their own sessions
        if (userProfile.role === 'student' && sessionResult.session.user_id === user.id) {
          result = await examSessionService.completeExamSession(sessionId)
        } else {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        break

      case 'pause':
        // Only students can pause their own sessions
        if (userProfile.role === 'student' && sessionResult.session.user_id === user.id) {
          result = await examSessionService.pauseExamSession(sessionId)
        } else {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        break

      case 'resume':
        // Only students can resume their own sessions
        if (userProfile.role === 'student' && sessionResult.session.user_id === user.id) {
          result = await examSessionService.resumeExamSession(sessionId)
        } else {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        break

      case 'terminate':
        // Only admin and examiner can terminate sessions
        if (['admin', 'examiner'].includes(userProfile.role)) {
          result = await examSessionService.terminateExamSession(sessionId, reason)
        } else {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      session: result.session,
    })

  } catch (error) {
    console.error('Update exam session API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}