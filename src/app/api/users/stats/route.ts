import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/users/stats - Get user statistics for admin dashboard
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user to verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Only admin can access user stats
    if (userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get user statistics
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, role')

    if (usersError) {
      throw new Error(usersError.message)
    }

    // Calculate stats
    const totalUsers = users?.length || 0
    const usersByRole = users?.reduce(
      (acc: { admin: number; examiner: number; student: number }, user) => {
        acc[user.role as keyof typeof acc]++
        return acc
      },
      { admin: 0, examiner: 0, student: 0 }
    ) || { admin: 0, examiner: 0, student: 0 }

    return NextResponse.json({
      success: true,
      totalUsers,
      usersByRole,
    })

  } catch (error) {
    console.error('Users stats API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}