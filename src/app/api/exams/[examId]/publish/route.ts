import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createExamService } from '@/lib/exams/service'

export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
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

    // Only examiner and admin can publish exams
    if (!['examiner', 'admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { examId } = await params

    // Check permissions - examiners can only publish their own exams
    if (userProfile.role === 'examiner') {
      const { data: existingExam, error: examError } = await supabase
        .from('exams')
        .select('created_by')
        .eq('id', examId)
        .single()

      if (examError || !existingExam) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
      }

      if (existingExam.created_by !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Use the exam service to publish the exam
    const examService = createExamService()
    const result = await examService.publishExam(examId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to publish exam' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Exam published successfully',
      exam: result.exam,
    })
  } catch (error) {
    console.error('Publish exam API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
