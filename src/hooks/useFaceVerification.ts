'use client'

import { useState, useCallback, useEffect } from 'react'
import type { VerificationResult } from '@/lib/facial-verification/service'

interface VerificationState {
  isVerified: boolean
  isVerifying: boolean
  result: VerificationResult | null
  error: string | null
  lastVerificationTime: Date | null
}

export function useFaceVerification() {
  const [state, setState] = useState<VerificationState>({
    isVerified: false,
    isVerifying: false,
    result: null,
    error: null,
    lastVerificationTime: null,
  })

  // Check if verification is still valid (expires after 1 hour)
  const isVerificationExpired = useCallback(() => {
    if (!state.lastVerificationTime) return true
    const now = new Date()
    const timeDiff = now.getTime() - state.lastVerificationTime.getTime()
    const oneHour = 60 * 60 * 1000
    return timeDiff > oneHour
  }, [state.lastVerificationTime])

  // Verify user identity
  const verifyIdentity = useCallback(async (liveCaptureBase64: string): Promise<VerificationResult> => {
    setState(prev => ({
      ...prev,
      isVerifying: true,
      error: null,
    }))

    try {
      const response = await fetch('/api/verify-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          liveCaptureBase64,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      if (!data.success || !data.verification) {
        throw new Error('Invalid response from verification service')
      }

      const result = data.verification as VerificationResult

      setState(prev => ({
        ...prev,
        isVerifying: false,
        isVerified: result.success,
        result,
        error: null,
        lastVerificationTime: result.success ? new Date() : null,
      }))

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed'
      
      setState(prev => ({
        ...prev,
        isVerifying: false,
        error: errorMessage,
      }))

      throw error
    }
  }, [])

  // Clear verification state
  const clearVerification = useCallback(() => {
    setState({
      isVerified: false,
      isVerifying: false,
      result: null,
      error: null,
      lastVerificationTime: null,
    })
  }, [])

  // Get verification status for exam access
  const getVerificationStatus = useCallback(() => {
    if (!state.isVerified || !state.result?.success) {
      return {
        canAccessExam: false,
        reason: 'Identity verification required',
      }
    }

    if (isVerificationExpired()) {
      return {
        canAccessExam: false,
        reason: 'Verification expired. Please verify again.',
      }
    }

    return {
      canAccessExam: true,
      reason: 'Verified',
    }
  }, [state.isVerified, state.result, isVerificationExpired])

  // Check verification status on mount and when it changes
  useEffect(() => {
    if (state.isVerified && isVerificationExpired()) {
      setState(prev => ({
        ...prev,
        isVerified: false,
      }))
    }
  }, [state.isVerified, isVerificationExpired])

  return {
    // State
    isVerified: state.isVerified && !isVerificationExpired(),
    isVerifying: state.isVerifying,
    result: state.result,
    error: state.error,
    lastVerificationTime: state.lastVerificationTime,

    // Actions
    verifyIdentity,
    clearVerification,
    getVerificationStatus,

    // Utilities
    isVerificationExpired,
  }
}

export default useFaceVerification