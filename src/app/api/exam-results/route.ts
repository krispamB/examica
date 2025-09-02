import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createResultsService } from '@/lib/results/service'
import type { ResultsFilters } from '@/lib/results/service'

// GET /api/exam-results - Get exam results with filtering
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

    const filters: ResultsFilters = {
      examId: searchParams.get('exam_id') || undefined,
      userId: searchParams.get('user_id') || undefined,
      sessionId: searchParams.get('session_id') || undefined,
      minScore: searchParams.get('min_score') ? parseFloat(searchParams.get('min_score')!) : undefined,
      maxScore: searchParams.get('max_score') ? parseFloat(searchParams.get('max_score')!) : undefined,
      completedAfter: searchParams.get('completed_after') || undefined,
      completedBefore: searchParams.get('completed_before') || undefined,
    }

    // Students can only see their own results
    if (userProfile.role === 'student') {
      filters.userId = user.id
    }

    const options = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sort_by') || 'submitted_at',
      sortOrder: (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc',
      includeDetails: searchParams.get('include_details') === 'true',
    }

    const resultsService = createResultsService()
    const result = await resultsService.getExamResults(filters, options)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({
      success: true,
      results: result.results,
      totalCount: result.totalCount,
      page: options.page,
      limit: options.limit,
      hasMore: ((result.totalCount || 0) > options.page * options.limit),
    })

  } catch (error) {
    console.error('Exam results API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// POST /api/exam-results - Calculate result for a completed session
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

    // Only admin and examiner can calculate results manually
    if (!['admin', 'examiner'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (!body.sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const resultsService = createResultsService()
    const result = await resultsService.calculateExamResult(body.sessionId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      result: result.result,
    })

  } catch (error) {
    console.error('Calculate exam result API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}