import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getQuestionGenerator } from '@/lib/ai/question-generator'

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

    // Only admin and examiner can generate exams
    if (!['admin', 'examiner'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.topic || !body.totalQuestions) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, totalQuestions' },
        { status: 400 }
      )
    }

    // Validate question type and difficulty percentages
    const typeTotal =
      (body.questionTypes?.multiple_choice || 0) +
      (body.questionTypes?.true_false || 0)
    const difficultyTotal =
      (body.difficulty?.easy || 0) +
      (body.difficulty?.medium || 0) +
      (body.difficulty?.hard || 0)

    if (typeTotal !== 100) {
      return NextResponse.json(
        { error: 'Question type percentages must sum to 100%' },
        { status: 400 }
      )
    }

    if (difficultyTotal !== 100) {
      return NextResponse.json(
        { error: 'Difficulty percentages must sum to 100%' },
        { status: 400 }
      )
    }

    // Validate total questions range
    if (body.totalQuestions < 5 || body.totalQuestions > 100) {
      return NextResponse.json(
        { error: 'Total questions must be between 5 and 100' },
        { status: 400 }
      )
    }

    // Prepare generation request with defaults
    const generationRequest = {
      topic: body.topic,
      subject: body.subject,
      totalQuestions: body.totalQuestions,
      duration: body.duration,
      questionTypes: {
        multiple_choice: body.questionTypes?.multiple_choice || 70,
        true_false: body.questionTypes?.true_false || 30,
      },
      difficulty: {
        easy: body.difficulty?.easy || 30,
        medium: body.difficulty?.medium || 50,
        hard: body.difficulty?.hard || 20,
      },
      context: body.context,
      learningObjectives: body.learningObjectives,
    }

    // Generate complete exam using AI
    const generator = getQuestionGenerator()
    const generationResult =
      await generator.generateCompleteExam(generationRequest)

    if (!generationResult.success) {
      return NextResponse.json(
        {
          error: `Exam generation failed: ${generationResult.error}`,
          metadata: generationResult.metadata,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      examData: generationResult.examData,
      metadata: generationResult.metadata,
      generator: `${userProfile.first_name} ${userProfile.last_name}`,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Exam generation API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
