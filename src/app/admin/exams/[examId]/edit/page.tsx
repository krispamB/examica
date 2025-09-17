import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createExamService } from '@/lib/exams/service'
import ExamBuilder from '@/components/examiner/ExamBuilder'

interface AdminEditExamPageProps {
  params: Promise<{
    examId: string
  }>
}

export default async function AdminEditExamPage({
  params,
}: AdminEditExamPageProps) {
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

    // Only admin can edit exams via admin interface
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
              Edit Exam (Admin)
            </h1>
            <p className="text-secondary">
              Administrative editing of &quot;{exam.title}&quot;
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
            {exam.status
              ? exam.status.charAt(0).toUpperCase() + exam.status.slice(1)
              : 'Unknown'}
          </div>
        </div>

        <div className="bg-info-light border border-info/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-info mt-0.5">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-info">
                Administrator Mode
              </h3>
              <p className="text-sm text-info mt-1">
                You are editing this exam with full administrative privileges.
                You can modify any exam regardless of the original creator.
              </p>
            </div>
          </div>
        </div>

        <ExamBuilder
          examId={examId}
          onSave={() => {
            // Refresh the page to show updated data
            window.location.reload()
          }}
        />
      </div>
    )
  } catch (error) {
    console.error('Admin edit exam page error:', error)
    redirect('/admin/exams')
  }
}

export async function generateMetadata({ params }: AdminEditExamPageProps) {
  const { examId } = await params

  try {
    const examService = createExamService()
    const examResult = await examService.getExam(examId)

    if (examResult.success && examResult.exam) {
      return {
        title: `Edit ${examResult.exam.title} (Admin) - Examica`,
        description: `Admin edit: ${examResult.exam.description || examResult.exam.title}`,
      }
    }
  } catch (error) {
    console.error('Generate metadata error:', error)
  }

  return {
    title: 'Edit Exam (Admin) - Examica',
    description: 'Administrative exam editing',
  }
}
