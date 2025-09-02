import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withExamSecurity, type ExamSessionContext } from '@/lib/middleware/examSecurity'

interface ExamStartRequest {
  studentConfirmation?: boolean
  browserInfo?: {
    userAgent: string
    screenResolution: string
    timezone: string
  }
}

async function startExamHandler(
  request: NextRequest,
  context: ExamSessionContext
): Promise<NextResponse> {
  const { userId, examId, isVerified, verificationTime } = context

  try {
    // Parse request body if present
    let body: ExamStartRequest = {}
    if (request.method === 'POST') {
      try {
        body = await request.json()
      } catch {
        // Body is optional for GET requests
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Get exam details and validate access
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select(`
        *,
        exam_sessions!inner(
          id,
          status,
          started_at,
          completed_at
        )
      `)
      .eq('id', examId)
      .eq('exam_sessions.user_id', userId)
      .single()

    if (examError && examError.code !== 'PGRST116') {
      throw new Error('Failed to fetch exam details')
    }

    // Check if exam exists and is accessible
    if (!exam) {
      const { data: examExists } = await supabase
        .from('exams')
        .select('id, title, status')
        .eq('id', examId)
        .single()

      if (!examExists) {
        return NextResponse.json(
          { error: 'Exam not found' },
          { status: 404 }
        )
      }

      if (examExists.status !== 'active') {
        return NextResponse.json(
          { error: 'Exam is not available' },
          { status: 403 }
        )
      }

      // Create new exam session
      const { data: newSession, error: sessionError } = await supabase
        .from('exam_sessions')
        .insert({
          user_id: userId,
          exam_id: examId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          verification_status: isVerified ? 'verified' : 'unverified',
          verification_time: verificationTime?.toISOString(),
          browser_info: body.browserInfo,
        })
        .select()
        .single()

      if (sessionError) {
        throw new Error('Failed to create exam session')
      }

      return NextResponse.json({
        success: true,
        examSession: newSession,
        exam: examExists,
        securityContext: {
          isVerified,
          verificationTime: verificationTime?.toISOString(),
          sessionStarted: new Date().toISOString(),
        },
      })
    }

    // Handle existing session
    const existingSession = exam.exam_sessions[0]

    if (existingSession.status === 'completed') {
      return NextResponse.json(
        { error: 'Exam has already been completed' },
        { status: 400 }
      )
    }

    if (existingSession.status === 'in_progress') {
      // Resume existing session
      return NextResponse.json({
        success: true,
        examSession: existingSession,
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          status: exam.status,
        },
        securityContext: {
          isVerified,
          verificationTime: verificationTime?.toISOString(),
          sessionResumed: new Date().toISOString(),
          originalStart: existingSession.started_at,
        },
      })
    }

    // Start/restart session
    const { data: updatedSession, error: updateError } = await supabase
      .from('exam_sessions')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        verification_status: isVerified ? 'verified' : 'unverified',
        verification_time: verificationTime?.toISOString(),
        browser_info: body.browserInfo,
      })
      .eq('id', existingSession.id)
      .select()
      .single()

    if (updateError) {
      throw new Error('Failed to start exam session')
    }

    return NextResponse.json({
      success: true,
      examSession: updatedSession,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        status: exam.status,
      },
      securityContext: {
        isVerified,
        verificationTime: verificationTime?.toISOString(),
        sessionStarted: new Date().toISOString(),
      },
    })

  } catch (error) {
    console.error(`Exam start error for user ${userId}, exam ${examId}:`, error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to start exam',
      },
      { status: 500 }
    )
  }
}

// Export the protected route handlers
export const GET = withExamSecurity(startExamHandler)
export const POST = withExamSecurity(startExamHandler)