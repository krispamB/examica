import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createExamService } from '@/lib/exams/service'
import ExamAnalyticsDashboard from '@/components/analytics/ExamAnalyticsDashboard'

interface ExamAnalyticsPageProps {
  params: Promise<{
    examId: string
  }>
}

export default async function ExamAnalyticsPage({
  params,
}: ExamAnalyticsPageProps) {
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

    // Only examiner and admin can view analytics
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

    // Check permissions - examiners can only view their own exam analytics
    if (userProfile.role === 'examiner' && exam.created_by !== user.id) {
      redirect('/examiner/exams')
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Exam Analytics
            </h1>
            <p className="text-secondary">
              Performance analysis and insights for &quot;{exam.title}&quot;
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">
                {exam.question_count || 0}
              </div>
              <div className="text-secondary">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">
                {exam.duration ? `${exam.duration}m` : '∞'}
              </div>
              <div className="text-secondary">Duration</div>
            </div>
            <div
              className={`text-center px-3 py-1 rounded-full text-xs font-medium ${
                exam.status === 'active'
                  ? 'bg-success-light text-success'
                  : exam.status === 'draft'
                    ? 'bg-warning-light text-warning'
                    : 'bg-background-secondary text-secondary'
              }`}
            >
              {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
            </div>
          </div>
        </div>

        <ExamAnalyticsDashboard examId={examId} examTitle={exam.title} />
      </div>
    )
  } catch (error) {
    console.error('Exam analytics page error:', error)
    redirect('/examiner/exams')
  }
}

export async function generateMetadata({ params }: ExamAnalyticsPageProps) {
  const { examId } = params

  try {
    const examService = createExamService()
    const examResult = await examService.getExam(examId)

    if (examResult.success && examResult.exam) {
      return {
        title: `${examResult.exam.title} Analytics - Examica`,
        description: `Performance analytics for exam: ${examResult.exam.title}`,
      }
    }
  } catch (error) {
    console.error('Generate metadata error:', error)
  }

  return {
    title: 'Exam Analytics - Examica',
    description: 'Exam performance analytics and insights',
  }
}
