import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboardContent from './AdminDashboardContent'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
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

    // Only admin can access admin dashboard
    if (userProfile.role !== 'admin') {
      redirect('/dashboard')
    }

    return <AdminDashboardContent userId={user.id} />
  } catch (error) {
    console.error('Admin dashboard error:', error)
    redirect('/login')
  }
}
