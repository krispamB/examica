import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createResultsService } from '@/lib/results/service'

interface Context {
  params: Promise<{
    resultId: string
  }>
}

// GET /api/exam-results/[resultId] - Get specific result
export async function GET(request: NextRequest, context: Context) {
  try {
    const { resultId } = await context.params
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

    // Get the result
    const { data: result, error } = await supabase
      .from('exam_results')
      .select(
        `
        *,
        exam_sessions(
          *,
          exams(title, description)
        ),
        user_profiles(first_name, last_name, email),
        exams(title)
      `
      )
      .eq('id', resultId)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 })
    }

    // Students can only see their own results
    if (userProfile.role === 'student' && result.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Get exam result API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// PATCH /api/exam-results/[resultId] - Update result (manual grading)
export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { resultId } = await context.params
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

    // Only admin and examiner can update results
    if (!['admin', 'examiner'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const updates = {
      totalScore: body.totalScore,
      percentageScore: body.percentageScore,
      gradedBy: user.id,
      graderNotes: body.graderNotes,
    }

    const resultsService = createResultsService()
    const result = await resultsService.updateExamResult(resultId, updates)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      result: result.result,
    })
  } catch (error) {
    console.error('Update exam result API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
