import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExamBuilder from '@/components/examiner/ExamBuilder'

export const dynamic = 'force-dynamic'

export default async function AdminCreateExamPage() {
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
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      redirect('/login')
    }

    // Only admin can create exams via admin interface
    if (userProfile.role !== 'admin') {
      redirect('/dashboard')
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Create New Exam (Admin)
          </h1>
          <p className="text-secondary">
            Create an exam with full administrative privileges
          </p>
        </div>

        <ExamBuilder
          onSave={(exam) => {
            window.location.href = `/admin/exams/${exam.id}/edit`
          }}
        />
      </div>
    )
  } catch (error) {
    console.error('Admin create exam page error:', error)
    redirect('/admin/exams')
  }
}

export const metadata = {
  title: 'Create Exam (Admin) - Examica',
  description: 'Create a new exam with administrative privileges',
}
