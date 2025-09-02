import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types/auth'

export interface InviteUserData {
  email: string
  role: UserRole
  firstName?: string
  lastName?: string
  institutionId?: string
  faceImage?: File
}

export interface InvitationResult {
  success: boolean
  error?: string
  invitationId?: string
  warning?: string
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate a secure random token for invitations
function generateInvitationToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

// Client-side invitation functions
export async function inviteUser(
  userData: InviteUserData
): Promise<InvitationResult> {
  try {
    // Basic validation
    if (!userData.email || !isValidEmail(userData.email)) {
      return {
        success: false,
        error: 'Valid email address is required',
      }
    }

    if (!userData.role) {
      return {
        success: false,
        error: 'User role is required',
      }
    }

    // Call the server-side API route that handles everything
    // Use FormData if we have a face image, otherwise JSON
    let body: FormData | string
    const headers: HeadersInit = {}

    if (userData.faceImage) {
      const formData = new FormData()
      formData.append('email', userData.email)
      formData.append('role', userData.role)
      if (userData.firstName) formData.append('firstName', userData.firstName)
      if (userData.lastName) formData.append('lastName', userData.lastName)
      if (userData.institutionId) formData.append('institutionId', userData.institutionId)
      formData.append('faceImage', userData.faceImage)
      
      body = formData
      // Don't set Content-Type header - browser will set it with boundary
    } else {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(userData)
    }

    const response = await fetch('/api/invite-user', {
      method: 'POST',
      headers,
      body,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to send invitation',
      }
    }

    return {
      success: true,
      invitationId: data.invitationId,
      warning: data.warning, // Include any warnings about email delivery
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to send invitation',
    }
  }
}

// Server-side invitation functions
export async function inviteUserServer(
  userData: InviteUserData,
  invitedBy: string
): Promise<InvitationResult> {
  const supabase = createClient()

  try {
    const invitationToken = generateInvitationToken()

    const { data, error } = await supabase
      .from('user_invitations')
      .insert({
        email: userData.email,
        role: userData.role,
        invited_by: invitedBy,
        invitation_token: invitationToken,
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName,
        },
        institution_id: userData.institutionId,
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      invitationId: data.id,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to send invitation',
    }
  }
}

export async function getInvitations() {
  // Call the server-side API route instead of direct database query
  const response = await fetch('/api/get-invitations', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch invitations')
  }

  return data.invitations
}

export async function cancelInvitation(
  invitationId: string
): Promise<InvitationResult> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('user_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to cancel invitation',
    }
  }
}

export async function resendInvitation(
  invitationId: string
): Promise<InvitationResult> {
  const supabase = createClient()

  try {
    const newToken = generateInvitationToken()

    const { error } = await supabase
      .from('user_invitations')
      .update({
        invitation_token: newToken,
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: 'pending',
      })
      .eq('id', invitationId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to resend invitation',
    }
  }
}
