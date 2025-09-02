import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createExamSessionService } from '@/lib/exam-sessions/service'
import type { SubmitResponseRequest } from '@/lib/exam-sessions/service'

interface Context {
  params: {
    sessionId: string
  }
}

// POST /api/exam-sessions/[sessionId]/responses - Submit question response
export async function POST(request: NextRequest, context: Context) {
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

    // Only students can submit responses
    if (userProfile.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can submit responses' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      )
    }

    if (body.response === undefined || body.response === null) {
      return NextResponse.json(
        { error: 'Response is required' },
        { status: 400 }
      )
    }

    const examSessionService = createExamSessionService()

    // Verify session belongs to current user and is active
    const sessionResult = await examSessionService.getExamSession(sessionId)
    if (!sessionResult.success || !sessionResult.session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (sessionResult.session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (sessionResult.session.status !== 'active') {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      )
    }

    const submitRequest: SubmitResponseRequest = {
      sessionId,
      questionId: body.questionId,
      response: body.response,
      timeSpent: body.timeSpent || undefined,
    }

    const result = await examSessionService.submitQuestionResponse(submitRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      response: result.response,
    })

  } catch (error) {
    console.error('Submit response API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}