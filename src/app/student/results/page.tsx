import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExamResultsHistory from '@/components/student/ExamResultsHistory'

export default async function StudentResultsPage() {
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

    // Only students can access student results
    if (userProfile.role !== 'student') {
      redirect('/dashboard')
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            My Exam Results
          </h1>
          <p className="text-secondary">
            View your exam performance history and detailed results
          </p>
        </div>

        <ExamResultsHistory />
      </div>
    )
  } catch (error) {
    console.error('Student results page error:', error)
    redirect('/login')
  }
}

export async function generateMetadata() {
  return {
    title: 'My Exam Results - Examica',
    description: 'View your exam performance history and detailed results',
  }
}
