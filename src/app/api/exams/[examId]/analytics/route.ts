import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createResultsService } from '@/lib/results/service'

interface Context {
  params: {
    examId: string
  }
}

// GET /api/exams/[examId]/analytics - Get exam analytics
export async function GET(request: NextRequest, context: Context) {
  try {
    const { examId } = context.params
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

    // Only admin and examiner can view analytics
    if (!['admin', 'examiner'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Verify exam exists
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, title')
      .eq('id', examId)
      .single()

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    const resultsService = createResultsService()
    const result = await resultsService.getExamAnalytics(examId)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({
      success: true,
      exam,
      analytics: result.analytics,
    })

  } catch (error) {
    console.error('Exam analytics API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}