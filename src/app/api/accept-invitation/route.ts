import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { UserRole } from '@/types/auth'
import { moveFaceImageFromTemp } from '@/lib/storage/face-images'

interface AcceptInvitationRequest {
  token: string
  firstName: string
  lastName: string
  password: string
}

// Simple rate limiting - in production, use Redis or similar
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5 // max 5 attempts per 15 minutes per IP

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now()
  const existing = rateLimitMap.get(clientIP)

  if (!existing || now > existing.resetTime) {
    // Reset or first request
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (existing.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false // Rate limited
  }

  existing.count++
  return true
}

function sanitizeInput(input: string): string {
  // Basic sanitization - remove potential dangerous characters
  return input.trim().replace(/[<>\"'&]/g, '')
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let invitationEmail = 'unknown'

  try {
    // Rate limiting check
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`)
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body: AcceptInvitationRequest = await request.json()

    // Validate required fields
    if (!body.token || !body.firstName || !body.lastName || !body.password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedFirstName = sanitizeInput(body.firstName)
    const sanitizedLastName = sanitizeInput(body.lastName)
    const sanitizedToken = sanitizeInput(body.token)

    // Validate password strength
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Create admin Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Validate invitation token
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('invitation_token', sanitizedToken)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    invitationEmail = invitation?.email || 'unknown'

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      )
    }

    // Check if user already exists with this email
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser.users?.some(
      (user: any) => user.email === invitation.email
    )

    if (userExists) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create user account using admin privileges
    const { data: userData, error: createError } =
      await supabase.auth.admin.createUser({
        email: invitation.email,
        password: body.password,
        email_confirm: true, // Skip email confirmation since they have valid invitation
        user_metadata: {
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
          role: invitation.role,
          invited_by: invitation.invited_by,
          invitation_id: invitation.id,
          face_image_url: invitation.user_metadata?.face_image_url, // Preserve face image from invitation
        },
      })

    if (createError) {
      console.error('User creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    if (!userData.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 500 }
      )
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('user_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Invitation update error:', updateError)
      // Don't fail the request since user was created successfully
    }

    // Handle face image migration from temp to final location
    let finalFaceImageUrl = invitation.user_metadata?.face_image_url

    console.log('Invitation face image URL:', finalFaceImageUrl)

    if (finalFaceImageUrl && finalFaceImageUrl.includes('temp-')) {
      console.log('Starting face image migration process...')
      try {
        const migrationResult = await moveFaceImageFromTemp(
          finalFaceImageUrl,
          userData.user.id,
          true // use server client
        )

        if (migrationResult.success && migrationResult.url) {
          finalFaceImageUrl = migrationResult.url
          console.log(
            `Successfully migrated face image for user ${userData.user.id}`
          )
          console.log('New image URL:', finalFaceImageUrl)

          // Only cleanup temp file if migration was successful
          try {
            console.log(
              'Attempting to cleanup temp file after successful migration...'
            )
            const url = new URL(invitation.user_metadata?.face_image_url)
            const pathParts = url.pathname.split('/')
            const tempPath = pathParts.slice(-2).join('/') // Get temp-id/filename

            const { error: cleanupError } = await supabase.storage
              .from('face-images')
              .remove([tempPath])

            if (cleanupError) {
              console.warn('Failed to cleanup temp file:', cleanupError)
            } else {
              console.log('Successfully cleaned up temp file:', tempPath)
            }
          } catch (cleanupError) {
            console.warn('Temp file cleanup error:', cleanupError)
          }
        } else {
          console.warn(`Failed to migrate face image: ${migrationResult.error}`)
          console.warn(
            'Using temp URL as fallback - temp file will remain for verification'
          )
          // Keep the temp URL as fallback AND keep the temp file for verification
        }
      } catch (error) {
        console.warn('Face image migration error:', error)
        console.warn('Using temp URL as fallback for now')
        // Continue with temp URL - it will still work for verification
      }
    } else {
      console.log('No face image migration needed:', {
        hasUrl: !!finalFaceImageUrl,
        isTemp: finalFaceImageUrl?.includes('temp-'),
      })
    }

    // Create user profile record (use upsert to handle duplicates)
    const { error: profileError } = await supabase.from('user_profiles').upsert(
      {
        id: userData.user.id,
        email: invitation.email,
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        role: invitation.role as UserRole,
        face_image_url: finalFaceImageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      }
    )

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail since user account was created successfully
    }

    // Generate session for auto-login (optional - for better UX)
    const { data: signInData, error: _signInError } =
      await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: invitation.email,
      })

    // Audit log successful invitation acceptance
    const duration = Date.now() - startTime
    console.log(
      `Invitation accepted successfully: ${JSON.stringify({
        email: invitationEmail,
        userId: userData.user.id,
        role: invitation.role,
        invitedBy: invitation.invited_by,
        clientIP: request.headers.get('x-forwarded-for') || 'unknown',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      })}`
    )

    // Return success with user data
    return NextResponse.json({
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        role: invitation.role,
      },
      // Provide magic link for auto-login if available
      loginUrl: signInData?.properties?.action_link,
    })
  } catch (error) {
    // Audit log failed invitation acceptance
    const duration = Date.now() - startTime
    console.error(
      `Invitation acceptance failed: ${JSON.stringify({
        email: invitationEmail,
        error: error instanceof Error ? error.message : 'Unknown error',
        clientIP: request.headers.get('x-forwarded-for') || 'unknown',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      })}`
    )

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
