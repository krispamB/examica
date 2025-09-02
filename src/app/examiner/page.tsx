import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExaminerDashboardContent from './ExaminerDashboardContent'

export default async function ExaminerDashboard() {
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

    // Only examiner and admin can access examiner dashboard
    if (!['examiner', 'admin'].includes(userProfile.role)) {
      redirect('/dashboard')
    }

    return <ExaminerDashboardContent userId={user.id} userRole={userProfile.role} />

  } catch (error) {
    console.error('Examiner dashboard error:', error)
    redirect('/login')
  }
}