import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createExamService } from '@/lib/exams/service'
import ExamBuilder from '@/components/examiner/ExamBuilder'

interface EditExamPageProps {
  params: Promise<{
    examId: string
  }>
}

export default async function EditExamPage({ params }: EditExamPageProps) {
  const { examId } = await params

  try {
    // Create Supabase client
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },

      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect('/login')
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      redirect('/login')
    }

    // Only examiner and admin can edit exams
    if (!['examiner', 'admin'].includes(userProfile.role)) {
      redirect('/dashboard')
    }

    // Get exam details
    const examService = createExamService()
    const examResult = await examService.getExam(examId)

    if (!examResult.success || !examResult.exam) {
      redirect('/examiner/exams')
    }

    const exam = examResult.exam

    // Check permissions - examiners can only edit their own exams
    if (userProfile.role === 'examiner' && exam.created_by !== user.id) {
      redirect('/examiner/exams')
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Exam</h1>
            <p className="text-secondary">
              Modify questions, settings, and configuration for &quot;
              {exam.title}&quot;
            </p>
          </div>

          {/* Status Badge */}
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              exam.status === 'active'
                ? 'bg-success-light text-success'
                : exam.status === 'draft'
                  ? 'bg-warning-light text-warning'
                  : 'bg-background-secondary text-secondary'
            }`}
          >
            {(exam.status || 'draft').charAt(0).toUpperCase() +
              (exam.status || 'draft').slice(1)}
          </div>
        </div>

        <ExamBuilder examId={examId} />
      </div>
    )
  } catch (error) {
    console.error('Edit exam page error:', error)
    redirect('/examiner/exams')
  }
}

export async function generateMetadata({ params }: EditExamPageProps) {
  const { examId } = await params

  try {
    const examService = createExamService()
    const examResult = await examService.getExam(examId)

    if (examResult.success && examResult.exam) {
      return {
        title: `Edit ${examResult.exam.title} - Examica`,
        description: `Edit exam: ${examResult.exam.description || examResult.exam.title}`,
      }
    }
  } catch (error) {
    console.error('Generate metadata error:', error)
  }

  return {
    title: 'Edit Exam - Examica',
    description: 'Edit exam settings and questions',
  }
}
