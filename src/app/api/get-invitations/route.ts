import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Create Supabase client with server context (has proper auth)
    const supabase = await createClient()

    // Get the current user (the admin requesting invitations)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all invitations first, then we'll manually join with profiles
    const { data: invitations, error } = await supabase
      .from('user_invitations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error fetching invitations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      )
    }

    // Manually join with user_profiles for invited_by information
    const invitationsWithProfiles = await Promise.all(
      (invitations || []).map(async (invitation) => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', invitation.invited_by)
          .single()

        return {
          ...invitation,
          invited_by_profile: profile,
        }
      })
    )

    return NextResponse.json({
      success: true,
      invitations: invitationsWithProfiles || [],
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
