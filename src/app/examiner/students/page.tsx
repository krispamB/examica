import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExaminerStudentsView from './ExaminerStudentsView'

export const dynamic = 'force-dynamic'

export default async function ExaminerStudentsPage() {
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

    // Only examiner and admin can access students view
    if (!['examiner', 'admin'].includes(userProfile.role)) {
      redirect('/dashboard')
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-secondary">
            View student performance and manage exam results
          </p>
        </div>

        <ExaminerStudentsView userId={user.id} userRole={userProfile.role} />
      </div>
    )
  } catch (error) {
    console.error('Examiner students page error:', error)
    redirect('/examiner')
  }
}

export const metadata = {
  title: 'Students - Examica',
  description: 'View student performance and exam results',
}
