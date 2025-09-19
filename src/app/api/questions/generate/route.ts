import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getQuestionGenerator } from '@/lib/ai/question-generator'
import { createQuestionService } from '@/lib/questions/service'
import type { QuestionGenerationRequest } from '@/lib/ai/question-generator'

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

    // Only admin and examiner can generate questions
    if (!['admin', 'examiner'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.topic || !body.type || !body.difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, type, difficulty' },
        { status: 400 }
      )
    }

    // Validate supported question types
    const supportedTypes = ['multiple_choice', 'true_false']
    if (!supportedTypes.includes(body.type)) {
      return NextResponse.json(
        {
          error: `Unsupported question type: ${body.type}. Supported types: ${supportedTypes.join(', ')}`,
          supported_types: supportedTypes,
        },
        { status: 400 }
      )
    }

    // Prepare generation request
    const generationRequest: QuestionGenerationRequest = {
      topic: body.topic,
      subject: body.subject,
      type: body.type,
      difficulty: body.difficulty,
      count: body.count || 1,
      context: body.context,
      learningObjectives: body.learningObjectives,
    }

    // Generate questions using AI
    const generator = getQuestionGenerator()
    const generationResult =
      await generator.generateQuestions(generationRequest)

    if (!generationResult.success) {
      return NextResponse.json(
        {
          error: `Question generation failed: ${generationResult.error}`,
          details: generationResult.metadata,
        },
        { status: 500 }
      )
    }

    // Check if user wants to save the questions immediately
    const saveQuestions = body.save !== false // Default to true

    if (saveQuestions && generationResult.questions.length > 0) {
      // Save generated questions to database
      const questionService = createQuestionService()
      const saveResult = await questionService.createQuestionsFromAI(
        generationResult.questions,
        user.id
      )

      if (!saveResult.success) {
        console.warn('Failed to save generated questions:', saveResult.errors)
        // Continue anyway, return the generated questions even if saving failed
      }

      return NextResponse.json({
        success: true,
        questions: saveResult.questions || generationResult.questions,
        generated: generationResult.questions.length,
        saved: saveResult.questions?.length || 0,
        generation_metadata: generationResult.metadata,
        generator: userProfile.first_name + ' ' + userProfile.last_name,
      })
    }

    // Return generated questions without saving
    return NextResponse.json({
      success: true,
      questions: generationResult.questions,
      generated: generationResult.questions.length,
      saved: 0,
      generation_metadata: generationResult.metadata,
      generator: userProfile.first_name + ' ' + userProfile.last_name,
    })
  } catch (error) {
    console.error('Question generation API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// POST /api/questions/generate/batch - Generate multiple question sets
export async function PATCH(request: NextRequest) {
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

    // Only admin and examiner can generate questions
    if (!['admin', 'examiner'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.topic || !body.specifications) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, specifications' },
        { status: 400 }
      )
    }

    const { topic, specifications } = body

    // Generate question set using AI
    const generator = getQuestionGenerator()
    const results = await generator.generateQuestionSet(topic, specifications)

    // Aggregate all questions and results
    interface ApiGeneratedQuestion {
      type: string
      question: string
      options?: string[]
      answer: string
      explanation?: string
      points: number
      difficulty: string
    }

    const allQuestions: ApiGeneratedQuestion[] = []
    const originalQuestions: import('@/lib/ai/question-generator').GeneratedQuestion[] =
      []
    let totalGenerated = 0
    let totalSaved = 0
    const errors: string[] = []

    for (const result of results) {
      if (result.success) {
        originalQuestions.push(...result.questions)
        const mappedQuestions: ApiGeneratedQuestion[] = result.questions.map(
          (q) => ({
            type: q.type,
            question: q.title,
            options: q.options?.map((opt) => opt.text),
            answer: String(q.correct_answer),
            explanation: q.explanation,
            points: q.points,
            difficulty: q.difficulty,
          })
        )
        allQuestions.push(...mappedQuestions)
        totalGenerated += result.questions.length
      } else {
        errors.push(result.error || 'Unknown error')
      }
    }

    // Save questions to database if requested
    const saveQuestions = body.save !== false // Default to true

    if (saveQuestions && originalQuestions.length > 0) {
      const questionService = createQuestionService()
      const saveResult = await questionService.createQuestionsFromAI(
        originalQuestions,
        user.id
      )

      if (saveResult.success) {
        totalSaved = saveResult.questions?.length || 0
      } else {
        errors.push(...(saveResult.errors || ['Failed to save questions']))
      }
    }

    return NextResponse.json({
      success: totalGenerated > 0,
      questions: allQuestions,
      total_generated: totalGenerated,
      total_saved: totalSaved,
      errors: errors.length > 0 ? errors : undefined,
      generation_results: results,
      generator: userProfile.first_name + ' ' + userProfile.last_name,
    })
  } catch (error) {
    console.error('Batch question generation API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
