import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminExamManagement from './AdminExamManagement'

export default async function AdminExamsPage() {
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

    // Only admin can access this page
    if (userProfile.role !== 'admin') {
      redirect('/dashboard')
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Exam Management</h1>
            <p className="text-secondary">
              System-wide exam oversight and administration
            </p>
          </div>
        </div>

        <AdminExamManagement userId={user.id} />
      </div>
    )

  } catch (error) {
    console.error('Admin exams page error:', error)
    redirect('/admin')
  }
}

export const metadata = {
  title: 'Exam Management - Examica',
  description: 'System-wide exam management and administration',
}