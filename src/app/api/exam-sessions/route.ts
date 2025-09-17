import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createExamSessionService } from '@/lib/exam-sessions/service'
import type {
  StartExamRequest,
  ExamSessionFilters,
} from '@/lib/exam-sessions/service'

// GET /api/exam-sessions - Get exam sessions with filtering
export async function GET(request: NextRequest) {
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

    const url = new URL(request.url)
    const searchParams = url.searchParams

    const filters: ExamSessionFilters = {
      examId: searchParams.get('exam_id') || undefined,
      userId: searchParams.get('user_id') || undefined,
      status:
        (searchParams.get('status') as
          | 'active'
          | 'paused'
          | 'completed'
          | 'terminated'
          | undefined) || undefined,
      startedAfter: searchParams.get('started_after') || undefined,
      startedBefore: searchParams.get('started_before') || undefined,
    }

    // Students can only see their own sessions
    if (userProfile.role === 'student') {
      filters.userId = user.id
    }

    const options = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sort_by') || 'started_at',
      sortOrder: (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc',
    }

    const examSessionService = createExamSessionService()
    const result = await examSessionService.getExamSessions(filters, options)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({
      success: true,
      sessions: result.sessions,
      totalCount: result.totalCount,
      page: options.page,
      limit: options.limit,
      hasMore: (result.totalCount || 0) > options.page * options.limit,
    })
  } catch (error) {
    console.error('Exam sessions API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// POST /api/exam-sessions - Start a new exam session
export async function POST(request: NextRequest) {
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

    // Only students can start exam sessions
    if (userProfile.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can start exam sessions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.examId) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      )
    }

    const startExamRequest: StartExamRequest = {
      examId: body.examId,
      requiresFacialVerification: body.requiresFacialVerification ?? true,
    }

    const examSessionService = createExamSessionService()
    const result = await examSessionService.startExamSession(
      user.id,
      startExamRequest
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      session: result.session,
    })
  } catch (error) {
    console.error('Start exam session API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
