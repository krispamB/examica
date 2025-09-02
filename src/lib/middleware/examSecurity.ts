import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createFacialVerificationService } from '@/lib/facial-verification/service'
import { isFacialRecognitionEnabled } from '@/lib/config/validation'

interface ExamSecurityOptions {
  requireVerification?: boolean
  verificationWindow?: number // minutes
  allowBypass?: boolean // for testing or admin override
}

export interface ExamSessionContext {
  userId: string
  examId: string
  isVerified: boolean
  verificationTime?: Date
  userRole: string
}

const DEFAULT_OPTIONS: Required<ExamSecurityOptions> = {
  requireVerification: true,
  verificationWindow: 60, // 1 hour
  allowBypass: false,
}

/**
 * Middleware to secure exam sessions with facial verification
 */
export async function examSecurityMiddleware(
  request: NextRequest,
  options: ExamSecurityOptions = {}
): Promise<{ success: boolean; context?: ExamSessionContext; error?: string; response?: NextResponse }> {
  const opts: Required<ExamSecurityOptions> = { ...DEFAULT_OPTIONS, ...options }
  
  try {
    // Create Supabase client
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Get user profile and role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return {
        success: false,
        error: 'User profile not found',
        response: NextResponse.json({ error: 'User profile not found' }, { status: 404 })
      }
    }

    // Extract exam ID from request (could be in URL params, body, etc.)
    const url = new URL(request.url)
    const examId = url.searchParams.get('examId') || 
                  url.pathname.split('/').pop() || 
                  'unknown'

    const context: ExamSessionContext = {
      userId: user.id,
      examId,
      isVerified: false,
      userRole: userProfile.role,
    }

    // Skip verification for non-students or if disabled globally
    if (userProfile.role !== 'student' || !opts.requireVerification || opts.allowBypass) {
      return {
        success: true,
        context: {
          ...context,
          isVerified: true,
        }
      }
    }

    // Check if facial recognition is enabled
    if (!isFacialRecognitionEnabled()) {
      console.warn('Facial recognition disabled, allowing exam access')
      return {
        success: true,
        context: {
          ...context,
          isVerified: true,
        }
      }
    }

    // Check recent verification status
    const verificationService = createFacialVerificationService()
    const verificationHistory = await verificationService.getVerificationHistory(user.id)

    // Find the most recent successful verification
    const recentVerification = verificationHistory
      .filter(attempt => attempt.success)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

    if (!recentVerification) {
      return {
        success: false,
        error: 'No valid facial verification found',
        response: NextResponse.json(
          { 
            error: 'Identity verification required before accessing exam',
            requiresVerification: true 
          }, 
          { status: 403 }
        )
      }
    }

    // Check if verification is still within the valid window
    const verificationTime = new Date(recentVerification.timestamp)
    const now = new Date()
    const timeDiffMinutes = (now.getTime() - verificationTime.getTime()) / (1000 * 60)

    if (timeDiffMinutes > opts.verificationWindow) {
      return {
        success: false,
        error: 'Facial verification has expired',
        response: NextResponse.json(
          { 
            error: 'Identity verification has expired. Please verify again.',
            requiresVerification: true,
            expiredAt: verificationTime.toISOString()
          }, 
          { status: 403 }
        )
      }
    }

    // Verification is valid
    return {
      success: true,
      context: {
        ...context,
        isVerified: true,
        verificationTime,
      }
    }

  } catch (error) {
    console.error('Exam security middleware error:', error)
    return {
      success: false,
      error: 'Security check failed',
      response: NextResponse.json(
        { error: 'Internal security error' }, 
        { status: 500 }
      )
    }
  }
}

/**
 * Higher-order function to wrap API routes with exam security
 */
export function withExamSecurity(
  handler: (request: NextRequest, context: ExamSessionContext) => Promise<NextResponse>,
  options: ExamSecurityOptions = {}
) {
  return async (request: NextRequest) => {
    const securityResult = await examSecurityMiddleware(request, options)
    
    if (!securityResult.success) {
      return securityResult.response || NextResponse.json(
        { error: securityResult.error }, 
        { status: 403 }
      )
    }

    if (!securityResult.context) {
      return NextResponse.json(
        { error: 'Security context not available' }, 
        { status: 500 }
      )
    }

    return handler(request, securityResult.context)
  }
}

/**
 * Utility to check if a user has valid verification for exam access
 */
export async function checkExamAccess(userId: string): Promise<{
  canAccess: boolean
  reason: string
  requiresVerification: boolean
  verificationTime?: Date
}> {
  try {
    if (!isFacialRecognitionEnabled()) {
      return {
        canAccess: true,
        reason: 'Facial recognition disabled',
        requiresVerification: false,
      }
    }

    const verificationService = createFacialVerificationService()
    const verificationHistory = await verificationService.getVerificationHistory(userId)

    const recentVerification = verificationHistory
      .filter(attempt => attempt.success)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

    if (!recentVerification) {
      return {
        canAccess: false,
        reason: 'No valid facial verification found',
        requiresVerification: true,
      }
    }

    const verificationTime = new Date(recentVerification.timestamp)
    const now = new Date()
    const timeDiffMinutes = (now.getTime() - verificationTime.getTime()) / (1000 * 60)

    if (timeDiffMinutes > DEFAULT_OPTIONS.verificationWindow!) {
      return {
        canAccess: false,
        reason: 'Facial verification has expired',
        requiresVerification: true,
        verificationTime,
      }
    }

    return {
      canAccess: true,
      reason: 'Verified',
      requiresVerification: false,
      verificationTime,
    }

  } catch (error) {
    console.error('Exam access check error:', error)
    return {
      canAccess: false,
      reason: 'Security check failed',
      requiresVerification: true,
    }
  }
}

export default examSecurityMiddleware