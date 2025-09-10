import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createExamService } from '@/lib/exams/service'
import ExamAnalyticsDashboard from '@/components/analytics/ExamAnalyticsDashboard'

interface AdminExamAnalyticsPageProps {
  params: Promise<{
    examId: string
  }>
}

export default async function AdminExamAnalyticsPage({
  params,
}: AdminExamAnalyticsPageProps) {
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

    // Only admin can access admin analytics
    if (userProfile.role !== 'admin') {
      redirect('/dashboard')
    }

    // Get exam details
    const examService = createExamService()
    const examResult = await examService.getExam(examId)

    if (!examResult.success || !examResult.exam) {
      redirect('/admin/exams')
    }

    const exam = examResult.exam

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Exam Analytics (Admin)
            </h1>
            <p className="text-secondary">
              Comprehensive performance analysis for &quot;{exam.title}&quot;
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

        <div className="bg-warning-light border border-warning/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-warning mt-0.5">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-warning">
                System-Wide Analytics
              </h3>
              <p className="text-sm text-warning mt-1">
                You are viewing system-wide analytics for this exam with full
                access to all performance data and student information.
              </p>
            </div>
          </div>
        </div>

        <ExamAnalyticsDashboard examId={examId} examTitle={exam.title} />
      </div>
    )
  } catch (error) {
    console.error('Admin exam analytics page error:', error)
    redirect('/admin/exams')
  }
}

export async function generateMetadata({
  params,
}: AdminExamAnalyticsPageProps) {
  const { examId } = await params

  try {
    const examService = createExamService()
    const examResult = await examService.getExam(examId)

    if (examResult.success && examResult.exam) {
      return {
        title: `${examResult.exam.title} Analytics (Admin) - Examica`,
        description: `System-wide analytics for exam: ${examResult.exam.title}`,
      }
    }
  } catch (error) {
    console.error('Generate metadata error:', error)
  }

  return {
    title: 'Exam Analytics (Admin) - Examica',
    description: 'System-wide exam analytics and insights',
  }
}
