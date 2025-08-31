import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendInvitationEmail } from '@/lib/email/service'
import { UserRole } from '@/types/auth'

interface InviteUserRequest {
  email: string
  role: UserRole
  firstName?: string
  lastName?: string
  institutionId?: string
}

function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export async function POST(request: NextRequest) {
  try {
    const body: InviteUserRequest = await request.json()

    // Validate required fields
    if (!body.email || !body.role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Create Supabase client with server context
    const supabase = await createClient()

    // Get the current user (the inviter)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the inviter's profile for the email
    const { data: inviterProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    const inviterName = inviterProfile
      ? `${inviterProfile.first_name} ${inviterProfile.last_name}`.trim()
      : 'Someone'

    // Generate invitation token
    const invitationToken = generateInvitationToken()

    // Create invitation record in database
    const { data: invitation, error: dbError } = await supabase
      .from('user_invitations')
      .insert({
        email: body.email,
        role: body.role,
        invited_by: user.id,
        invitation_token: invitationToken,
        user_metadata: {
          first_name: body.firstName,
          last_name: body.lastName,
        },
        institution_id: body.institutionId,
        // Expires in 7 days
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Send invitation email
    const emailResult = await sendInvitationEmail({
      email: body.email,
      token: invitationToken,
      inviterName,
      recipientName: body.firstName
        ? `${body.firstName} ${body.lastName || ''}`.trim()
        : undefined,
      institutionName: 'Your Institution', // TODO: Get from settings
    })

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error)

      // Update invitation status to indicate email failed
      await supabase
        .from('user_invitations')
        .update({
          status: 'pending', // Keep as pending but log the email failure
          updated_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)

      // Still return success since invitation was created, but warn about email
      return NextResponse.json({
        success: true,
        invitationId: invitation.id,
        warning: 'Invitation created but email delivery failed',
      })
    }

    // Success! Update invitation status
    await supabase
      .from('user_invitations')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)

    return NextResponse.json({
      success: true,
      invitationId: invitation.id,
      messageId: emailResult.messageId,
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
