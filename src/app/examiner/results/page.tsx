import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExaminerResultsView from './ExaminerResultsView'

export const dynamic = 'force-dynamic'

export default async function ExaminerResultsPage() {
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

    // Only examiner and admin can access examiner results
    if (!['examiner', 'admin'].includes(userProfile.role)) {
      redirect('/dashboard')
    }

    return <ExaminerResultsView userId={user.id} userRole={userProfile.role} />
  } catch (error) {
    console.error('Examiner results page error:', error)
    redirect('/login')
  }
}

export async function generateMetadata() {
  return {
    title: 'Exam Results - Examica',
    description:
      'View all exam results and student performance across your exams',
  }
}
