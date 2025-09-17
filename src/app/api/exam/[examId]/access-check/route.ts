import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkExamAccess } from '@/lib/middleware/examSecurity'

interface ExamAccessParams {
  params: Promise<{
    examId: string
  }>
}

export async function GET(_request: NextRequest, { params }: ExamAccessParams) {
  try {
    const { examId } = await params

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

    // Get user profile
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

    // Get exam details
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, title, description, status, duration, requires_verification')
      .eq('id', examId)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Check if exam is active
    if (exam.status !== 'active') {
      return NextResponse.json({
        success: true,
        canAccess: false,
        reason: 'Exam is not currently available',
        exam: {
          id: exam.id,
          title: exam.title,
          status: exam.status,
        },
        requiresVerification: false,
      })
    }

    // Check existing exam session
    const { data: existingSession } = await supabase
      .from('exam_sessions')
      .select('id, status, started_at, completed_at')
      .eq('user_id', user.id)
      .eq('exam_id', examId)
      .single()

    if (existingSession?.status === 'completed') {
      return NextResponse.json({
        success: true,
        canAccess: false,
        reason: 'Exam has already been completed',
        exam: {
          id: exam.id,
          title: exam.title,
          status: exam.status,
        },
        sessionStatus: existingSession.status,
        completedAt: existingSession.completed_at,
        requiresVerification: false,
      })
    }

    // For non-students, skip verification checks
    if (userProfile.role !== 'student') {
      return NextResponse.json({
        success: true,
        canAccess: true,
        reason: 'Admin/Staff access granted',
        exam,
        userRole: userProfile.role,
        requiresVerification: false,
      })
    }

    // Check verification requirements for students
    const requiresVerification = exam.requires_verification !== false // Default to true if not specified

    if (!requiresVerification) {
      return NextResponse.json({
        success: true,
        canAccess: true,
        reason: 'No verification required for this exam',
        exam,
        requiresVerification: false,
      })
    }

    // Check facial verification status
    const accessCheck = await checkExamAccess(user.id)

    return NextResponse.json({
      success: true,
      canAccess: accessCheck.canAccess,
      reason: accessCheck.reason,
      exam,
      requiresVerification: accessCheck.requiresVerification,
      verificationTime: accessCheck.verificationTime?.toISOString(),
      sessionStatus: existingSession?.status,
      userRole: userProfile.role,
    })
  } catch (error) {
    console.error('Exam access check error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
