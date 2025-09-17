import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExamMonitorDashboard from '@/components/examiner/ExamMonitorDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminMonitorPage() {
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

    // Only admin and examiner can access monitor
    if (!['admin', 'examiner'].includes(userProfile.role)) {
      redirect('/dashboard')
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Exam Monitor
          </h1>
          <p className="text-secondary">
            Real-time monitoring of all exam sessions across the platform
          </p>
        </div>

        <ExamMonitorDashboard />
      </div>
    )
  } catch (error) {
    console.error('Admin monitor page error:', error)
    redirect('/dashboard')
  }
}

export const metadata = {
  title: 'Exam Monitor - Examica',
  description: 'Real-time monitoring of exam sessions',
}
