import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExaminerExamsList from './ExaminerExamsList'

export const dynamic = 'force-dynamic'

export default async function ExaminerExamsPage() {
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

    // Only examiner and admin can access this page
    if (!['examiner', 'admin'].includes(userProfile.role)) {
      redirect('/dashboard')
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Exams</h1>
            <p className="text-secondary">
              Manage your exams, view results, and monitor student progress
            </p>
          </div>
        </div>

        <ExaminerExamsList userId={user.id} userRole={userProfile.role} />
      </div>
    )
  } catch (error) {
    console.error('Examiner exams page error:', error)
    redirect('/examiner')
  }
}

export const metadata = {
  title: 'My Exams - Examica',
  description: 'Manage your exams and monitor student progress',
}
