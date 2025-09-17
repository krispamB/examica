import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createQuestionService } from '@/lib/questions/service'
import type { GeneratedQuestion } from '@/lib/ai/question-generator'

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
      .select('role, first_name, last_name')
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
    if (
      !body.questions ||
      !Array.isArray(body.questions) ||
      body.questions.length === 0
    ) {
      return NextResponse.json(
        {
          error: 'Missing required field: questions (must be non-empty array)',
        },
        { status: 400 }
      )
    }

    // Create questions in database
    const questionService = createQuestionService()
    const saveResult = await questionService.createQuestionsFromAI(
      body.questions as GeneratedQuestion[],
      user.id
    )

    if (!saveResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to create questions in database',
          details: saveResult.errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      questions: saveResult.questions,
      created_count: saveResult.questions?.length || 0,
      creator: `${userProfile.first_name} ${userProfile.last_name}`,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Bulk question creation API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
