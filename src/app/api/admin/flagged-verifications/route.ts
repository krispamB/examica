import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createFacialVerificationService } from '@/lib/facial-verification/service'

export async function GET() {
  try {
    // Create Supabase client with server context
    const supabase = await createClient()

    // Get the current user
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

    // Check if user is admin
    if (userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get flagged verification attempts
    const verificationService = createFacialVerificationService()
    const flaggedAttempts = await verificationService.getFlaggedVerifications()

    // Get additional context for each flagged user
    const userIds = [...new Set(flaggedAttempts.map(attempt => attempt.userId))]
    
    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, institution_id')
      .in('id', userIds)

    // Combine flagged attempts with user information
    const enrichedAttempts = flaggedAttempts.map(attempt => {
      const userProfile = userProfiles?.find(profile => profile.id === attempt.userId)
      return {
        ...attempt,
        userEmail: userProfile?.email || 'Unknown',
        institutionId: userProfile?.institution_id,
      }
    })

    return NextResponse.json({
      success: true,
      flaggedAttempts: enrichedAttempts,
      totalCount: enrichedAttempts.length,
    })
  } catch (error) {
    console.error('Admin flagged verifications API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}