import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateExamClient from './CreateExamClient'

export default async function CreateExamPage() {
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

    // Only examiner and admin can create exams
    if (!['examiner', 'admin'].includes(userProfile.role)) {
      redirect('/dashboard')
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Exam</h1>
          <p className="text-secondary">
            Design your exam by adding questions, setting time limits, and configuring options
          </p>
        </div>

        <CreateExamClient userId={user.id} />
      </div>
    )

  } catch (error) {
    console.error('Create exam page error:', error)
    redirect('/examiner')
  }
}

export const metadata = {
  title: 'Create Exam - Examica',
  description: 'Create a new exam with custom questions and settings',
}