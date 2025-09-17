import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createFacialVerificationService } from '@/lib/facial-verification/service'
import { isFacialRecognitionEnabled } from '@/lib/config/validation'

interface VerifyIdentityRequest {
  liveCaptureBase64: string
}

export async function POST(request: NextRequest) {
  try {
    // Check if facial recognition is enabled
    if (!isFacialRecognitionEnabled()) {
      return NextResponse.json(
        { error: 'Facial recognition service is not configured' },
        { status: 503 }
      )
    }

    // Parse request body
    let body: VerifyIdentityRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.liveCaptureBase64) {
      return NextResponse.json(
        { error: 'Live capture image is required' },
        { status: 400 }
      )
    }

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

    // Get user role to ensure only students can verify
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (userProfile.role !== 'student') {
      return NextResponse.json(
        { error: 'Facial verification is only available for students' },
        { status: 403 }
      )
    }

    // Create verification service and perform verification
    const verificationService = createFacialVerificationService()
    const result = await verificationService.verifyUserIdentity(
      user.id,
      body.liveCaptureBase64
    )

    // Log verification for security audit
    console.log(`Verification attempt for user ${user.id} (${userProfile.first_name} ${userProfile.last_name}):`, {
      success: result.success,
      similarity: result.similarity,
      shouldFlag: result.shouldFlag,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      verification: result,
    })
  } catch (error) {
    console.error('Identity verification API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}