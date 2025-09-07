import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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

    // Only examiner and admin can view exams
    if (!['examiner', 'admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { examId } = await params

    // Get exam with questions
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select(
        `
        *,
        exam_questions (
          id,
          question_id,
          order_index,
          points,
          required,
          questions (
            id,
            title,
            content,
            type,
            difficulty,
            category,
            tags,
            options,
            correct_answer,
            explanation,
            points
          )
        )
      `
      )
      .eq('id', examId)
      .single()

    if (examError) {
      console.error('Error fetching exam:', examError)
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Check permissions - examiners can only view their own exams
    if (userProfile.role === 'examiner' && exam.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      exam,
    })
  } catch (error) {
    console.error('Get exam API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    // Only examiner and admin can update exams
    if (!['examiner', 'admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { examId } = await params
    const body = await request.json()

    // Get existing exam to check permissions
    const { data: existingExam, error: examError } = await supabase
      .from('exams')
      .select('created_by')
      .eq('id', examId)
      .single()

    if (examError) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Check permissions - examiners can only update their own exams
    if (
      userProfile.role === 'examiner' &&
      existingExam.created_by !== user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update exam basic info
    const { data: updatedExam, error: updateError } = await supabase
      .from('exams')
      .update({
        title: body.title,
        description: body.description,
        duration: body.duration,
        requires_verification: body.requires_verification,
        updated_at: new Date().toISOString(),
      })
      .eq('id', examId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating exam:', updateError)
      return NextResponse.json(
        { error: 'Failed to update exam' },
        { status: 500 }
      )
    }

    // Handle question associations if provided
    if (body.questions && Array.isArray(body.questions)) {
      // Delete existing question associations
      await supabase.from('exam_questions').delete().eq('exam_id', examId)

      // Insert new question associations
      if (body.questions.length > 0) {
        const examQuestions = body.questions.map(
          (
            q: { question_id: string; points?: number; required?: boolean },
            index: number
          ) => ({
            exam_id: examId,
            question_id: q.question_id,
            order_index: index,
            points: q.points || 1,
            required: q.required ?? true,
          })
        )

        const { error: insertError } = await supabase
          .from('exam_questions')
          .insert(examQuestions)

        if (insertError) {
          console.error('Error inserting exam questions:', insertError)
          return NextResponse.json(
            { error: 'Failed to update exam questions' },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      exam: updatedExam,
    })
  } catch (error) {
    console.error('Update exam API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
