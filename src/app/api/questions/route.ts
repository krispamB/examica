import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createQuestionService } from '@/lib/questions/service'
import type { QuestionFilters } from '@/lib/questions/service'

// GET /api/questions - List questions with filtering and pagination
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

    // Only admin and examiner can access questions
    if (!['admin', 'examiner'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const searchParams = url.searchParams

    const filters: QuestionFilters = {
      type: searchParams.get('type') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      category: searchParams.get('category') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      aiGenerated: searchParams.get('ai_generated') ? 
        searchParams.get('ai_generated') === 'true' : undefined,
      createdBy: searchParams.get('created_by') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const options = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sort_by') || 'created_at',
      sortOrder: (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc',
    }

    // Create question service and get questions
    const questionService = createQuestionService()
    const result = await questionService.getQuestions(filters, options)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({
      success: true,
      questions: result.questions,
      totalCount: result.totalCount,
      page: options.page,
      limit: options.limit,
      hasMore: ((result.totalCount || 0) > options.page * options.limit),
    })

  } catch (error) {
    console.error('Questions API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// POST /api/questions - Create a new question
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

    // Only admin and examiner can create questions
    if (!['admin', 'examiner'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.content || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, type' },
        { status: 400 }
      )
    }

    // Prepare question data
    const questionData = {
      title: body.title,
      content: body.content,
      type: body.type,
      difficulty: body.difficulty || 'medium',
      category: body.category || null,
      tags: body.tags || null,
      options: body.options ? JSON.parse(JSON.stringify(body.options)) : null,
      correct_answer: JSON.parse(JSON.stringify(body.correct_answer)),
      explanation: body.explanation || null,
      points: body.points || 1,
      ai_generated: false, // Manual questions are not AI generated
      ai_metadata: null,
      created_by: user.id,
    }

    // Create question service and create question
    const questionService = createQuestionService()
    const result = await questionService.createQuestion(questionData)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({
      success: true,
      question: result.question,
    })

  } catch (error) {
    console.error('Create question API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}