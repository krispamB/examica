import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createExamService } from '@/lib/exams/service'
import type { ExamFilters, ExamCreateData } from '@/lib/exams/service'

// GET /api/exams - List exams with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
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

    // Only admin and examiner can list exams
    if (!['admin', 'examiner'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const searchParams = url.searchParams

    const filters: ExamFilters = {
      status: searchParams.get('status') as 'draft' | 'active' | 'archived' | undefined || undefined,
      createdBy: searchParams.get('created_by') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const options = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      includeQuestions: searchParams.get('include_questions') === 'true',
      sortBy: searchParams.get('sort_by') || 'updated_at',
      sortOrder: (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc',
    }

    // Create exam service and get exams
    const examService = createExamService()
    const result = await examService.getExams(filters, options)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({
      success: true,
      exams: result.exams,
      totalCount: result.totalCount,
      page: options.page,
      limit: options.limit,
      hasMore: ((result.totalCount || 0) > options.page * options.limit),
    })

  } catch (error) {
    console.error('Exams API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// POST /api/exams - Create a new exam
export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
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

    // Only admin and examiner can create exams
    if (!['admin', 'examiner'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Validate questions if provided
    if (body.questions && !Array.isArray(body.questions)) {
      return NextResponse.json(
        { error: 'Questions must be an array' },
        { status: 400 }
      )
    }

    // Prepare exam data
    const examData: ExamCreateData = {
      title: body.title,
      description: body.description,
      duration: body.duration ? parseInt(body.duration) : undefined,
      requires_verification: body.requires_verification ?? true,
      questions: body.questions || [],
    }

    // Create exam service and create exam
    const examService = createExamService()
    const result = await examService.createExam(examData, user.id)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({
      success: true,
      exam: result.exam,
    })

  } catch (error) {
    console.error('Create exam API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}