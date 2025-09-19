import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'
import { getRekognitionService } from '@/lib/aws/rekognition'
import { urlToBase64 } from '@/lib/storage/face-images'

export interface VerificationAttempt {
  userId: string
  success: boolean
  similarity: number
  confidence: number
  timestamp: string
  error?: string
}

export interface VerificationResult {
  success: boolean
  similarity: number
  confidence: number
  message: string
  shouldFlag: boolean
  attemptId?: string
}

export class FacialVerificationService {
  private rekognition
  private supabase

  constructor(useServerClient = true) {
    this.rekognition = getRekognitionService()
    this.supabase = useServerClient ? null : createClientClient()
  }

  private async getSupabaseClient() {
    if (this.supabase) {
      return this.supabase
    }
    return await createClient()
  }

  /**
   * Verify a user's identity by comparing their live capture with stored reference image
   * @param userId - The user's ID
   * @param liveCaptureBase64 - Base64 encoded live capture image
   * @returns Verification result
   */
  async verifyUserIdentity(
    userId: string,
    liveCaptureBase64: string
  ): Promise<VerificationResult> {
    try {
      const supabase = await this.getSupabaseClient()

      // Get user's stored face image
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('face_image_url, first_name, last_name')
        .eq('id', userId)
        .single()

      if (profileError || !userProfile) {
        return {
          success: false,
          similarity: 0,
          confidence: 0,
          message: 'User profile not found',
          shouldFlag: true,
        }
      }

      if (!userProfile.face_image_url) {
        return {
          success: false,
          similarity: 0,
          confidence: 0,
          message:
            'No reference face image found. Please contact your administrator.',
          shouldFlag: false,
        }
      }

      // Convert stored image URL to base64
      let referenceImageBase64: string
      try {
        referenceImageBase64 = await urlToBase64(userProfile.face_image_url)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load reference image:', error)
        }
        return {
          success: false,
          similarity: 0,
          confidence: 0,
          message:
            'Failed to load reference image. Please contact your administrator.',
          shouldFlag: true,
        }
      }

      // Perform face comparison using AWS Rekognition
      const comparisonResult = await this.rekognition.compareFaces(
        referenceImageBase64,
        liveCaptureBase64
      )

      // Log the verification attempt
      const attemptData: Omit<VerificationAttempt, 'attemptId'> = {
        userId,
        success: comparisonResult.success,
        similarity: comparisonResult.similarity,
        confidence: comparisonResult.confidence,
        timestamp: new Date().toISOString(),
        ...(comparisonResult.error && { error: comparisonResult.error }),
      }

      const attemptId = await this.logVerificationAttempt(attemptData)

      // Determine the result message and flagging status
      let message: string
      let shouldFlag = false

      if (comparisonResult.success) {
        message = `Identity verified successfully (${comparisonResult.similarity.toFixed(1)}% match)`
      } else {
        shouldFlag = true
        if (comparisonResult.similarity > 60) {
          message = `Identity verification failed. Similarity: ${comparisonResult.similarity.toFixed(1)}% (threshold: 80%)`
        } else if (comparisonResult.error?.includes('No face detected')) {
          message =
            'No face detected in the image. Please ensure your face is clearly visible and try again.'
          shouldFlag = false // Don't flag technical issues
        } else {
          message = comparisonResult.error || 'Identity verification failed'
        }
      }

      return {
        success: comparisonResult.success,
        similarity: comparisonResult.similarity,
        confidence: comparisonResult.confidence,
        message,
        shouldFlag,
        ...(attemptId && { attemptId }),
      }
    } catch (error) {
      console.error('Facial verification error:', error)

      // Log the failed attempt
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      const attemptData: Omit<VerificationAttempt, 'attemptId'> = {
        userId,
        success: false,
        similarity: 0,
        confidence: 0,
        timestamp: new Date().toISOString(),
        error: errorMessage,
      }

      await this.logVerificationAttempt(attemptData)

      return {
        success: false,
        similarity: 0,
        confidence: 0,
        message:
          'Verification service error. Please try again or contact support.',
        shouldFlag: true,
      }
    }
  }

  /**
   * Log a verification attempt to the database
   */
  private async logVerificationAttempt(
    attempt: Omit<VerificationAttempt, 'attemptId'>
  ): Promise<string | undefined> {
    try {
      const supabase = await this.getSupabaseClient()

      // Update or create facial verification record
      const { data: existingRecord } = await supabase
        .from('facial_verifications')
        .select('id, verification_attempts')
        .eq('user_id', attempt.userId)
        .eq('is_active', true)
        .single()

      const attemptRecord = {
        timestamp: attempt.timestamp,
        success: attempt.success,
        similarity: attempt.similarity,
        confidence: attempt.confidence,
        error: attempt.error,
      }

      if (existingRecord) {
        // Update existing record with new attempt
        const existingAttempts =
          (existingRecord.verification_attempts as VerificationAttempt[]) || []
        const updatedAttempts = [...existingAttempts, attemptRecord]

        await supabase
          .from('facial_verifications')
          .update({
            verification_attempts: updatedAttempts,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRecord.id)

        return existingRecord.id
      } else {
        // Create new record
        const { data: newRecord } = await supabase
          .from('facial_verifications')
          .insert({
            user_id: attempt.userId,
            aws_face_id: `temp-${Date.now()}`, // Temporary until we implement face collections
            confidence_score: attempt.confidence,
            verification_attempts: [attemptRecord],
            is_active: true,
          })
          .select('id')
          .single()

        return newRecord?.id
      }
    } catch (error) {
      console.error('Failed to log verification attempt:', error)
      return undefined
    }
  }

  /**
   * Get verification history for a user
   */
  async getVerificationHistory(userId: string): Promise<VerificationAttempt[]> {
    try {
      const supabase = await this.getSupabaseClient()

      const { data: record } = await supabase
        .from('facial_verifications')
        .select('verification_attempts')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (!record || !record.verification_attempts) {
        return []
      }

      return (record.verification_attempts as VerificationAttempt[]).map(
        (attempt) => ({
          ...attempt,
          userId,
        })
      )
    } catch (error) {
      console.error('Failed to get verification history:', error)
      return []
    }
  }

  /**
   * Get flagged verification attempts for admin review
   */
  async getFlaggedVerifications(): Promise<
    Array<VerificationAttempt & { userName: string }>
  > {
    try {
      const supabase = await this.getSupabaseClient()

      const { data: records } = await supabase
        .from('facial_verifications')
        .select(
          `
          user_id,
          verification_attempts,
          user_profiles!inner(first_name, last_name)
        `
        )
        .eq('is_active', true)

      if (!records) return []

      const flaggedAttempts: Array<VerificationAttempt & { userName: string }> =
        []

      records.forEach((record) => {
        const attempts =
          (record.verification_attempts as VerificationAttempt[]) || []
        const profile = record.user_profiles as {
          first_name?: string
          last_name?: string
        }

        attempts
          .filter((attempt) => !attempt.success && attempt.similarity > 0) // Flagged attempts
          .forEach((attempt) => {
            flaggedAttempts.push({
              ...attempt,
              userId: record.user_id,
              userName: `${profile.first_name} ${profile.last_name}`.trim(),
            })
          })
      })

      // Sort by timestamp (most recent first)
      return flaggedAttempts.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    } catch (error) {
      console.error('Failed to get flagged verifications:', error)
      return []
    }
  }

  /**
   * Validate an uploaded face image before storing
   */
  async validateFaceImage(imageBase64: string): Promise<{
    valid: boolean
    confidence?: number
    issues: string[]
  }> {
    return await this.rekognition.validateFaceImage(imageBase64)
  }
}

// Factory function to create service instance
export function createFacialVerificationService(
  useServerClient = true
): FacialVerificationService {
  return new FacialVerificationService(useServerClient)
}
