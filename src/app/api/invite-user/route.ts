import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendInvitationEmail } from '@/lib/email/service'
import { uploadFaceImage } from '@/lib/storage/face-images'
import { UserRole } from '@/types/auth'

interface InviteUserRequest {
  email: string
  role: UserRole
  firstName?: string
  lastName?: string
  institutionId?: string
  faceImage?: File
}

function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body - could be JSON or FormData
    let body: InviteUserRequest
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with file upload)
      const formData = await request.formData()
      
      body = {
        email: formData.get('email') as string,
        role: formData.get('role') as UserRole,
        firstName: formData.get('firstName') as string || undefined,
        lastName: formData.get('lastName') as string || undefined,
        institutionId: formData.get('institutionId') as string || undefined,
        faceImage: formData.get('faceImage') as File || undefined,
      }
    } else {
      // Handle JSON (no file upload)
      const jsonBody = await request.json()
      body = {
        email: jsonBody.email,
        role: jsonBody.role,
        firstName: jsonBody.firstName,
        lastName: jsonBody.lastName,
        institutionId: jsonBody.institutionId,
      }
    }

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

    // Handle face image upload if provided (only for students)
    let faceImageUrl: string | undefined
    if (body.faceImage && body.role === 'student') {
      try {
        // Generate a temporary user ID for the face image storage
        // We'll update the user profile with this URL after they accept the invitation
        const tempUserId = `temp-${invitationToken}`
        
        const uploadResult = await uploadFaceImage(body.faceImage, tempUserId, true)
        
        if (uploadResult.success && uploadResult.url) {
          faceImageUrl = uploadResult.url
        } else {
          console.warn('Face image upload failed:', uploadResult.error)
          // Don't fail the entire invitation for face image issues
        }
      } catch (error) {
        console.warn('Face image upload error:', error)
        // Continue without face image
      }
    }

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
          face_image_url: faceImageUrl,
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
      institutionName: process.env.INSTITUTION_NAME || 'Examica Institution'
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
