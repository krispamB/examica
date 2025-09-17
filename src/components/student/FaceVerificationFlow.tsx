'use client'

import React, { useState, useCallback } from 'react'
import { Shield, AlertCircle } from 'lucide-react'
import FaceCameraCapture from '@/components/common/FaceCaptureCamera'
import FaceVerificationResult from '@/components/common/FaceVerificationResult'
import type { VerificationResult } from '@/lib/facial-verification/service'

type VerificationStep = 'intro' | 'capture' | 'verifying' | 'result'

interface FaceVerificationFlowProps {
  onSuccess?: () => void
  onCancel?: () => void
  onFailed?: () => void
  examTitle?: string
  className?: string
}

export const FaceVerificationFlow: React.FC<FaceVerificationFlowProps> = ({
  onSuccess,
  onCancel,
  onFailed,
  examTitle = 'your exam',
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState<VerificationStep>('intro')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Start the verification process
  const startVerification = useCallback(() => {
    setCurrentStep('capture')
    setError(null)
  }, [])

  // Handle image capture from camera
  const handleImageCapture = useCallback(async (imageBase64: string) => {
    setCurrentStep('verifying')
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/verify-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          liveCaptureBase64: imageBase64,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      if (!data.success || !data.verification) {
        throw new Error('Invalid response from verification service')
      }

      setVerificationResult(data.verification)
      setCurrentStep('result')
    } catch (err) {
      console.error('Verification error:', err)
      setError(err instanceof Error ? err.message : 'Verification failed')
      setCurrentStep('capture')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // Handle retry verification
  const handleRetry = useCallback(() => {
    setCurrentStep('capture')
    setVerificationResult(null)
    setError(null)
  }, [])

  // Handle successful verification
  const handleProceed = useCallback(() => {
    if (verificationResult?.success && onSuccess) {
      onSuccess()
    }
  }, [verificationResult, onSuccess])

  // Handle verification failure
  const handleFailure = useCallback(() => {
    if (onFailed) {
      onFailed()
    }
  }, [onFailed])

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    }
  }, [onCancel])

  // Render based on current step
  if (currentStep === 'intro') {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto ${className}`}>
        <div className="text-center">
          <div className="bg-blue-50 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Shield className="w-10 h-10 text-blue-500" />
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Identity Verification Required
          </h2>
          
          <p className="text-gray-600 mb-6">
            Before you can access <strong>{examTitle}</strong>, we need to verify your identity 
            using facial recognition for security purposes.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-blue-900 mb-2">What happens during verification:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• We&apos;ll ask you to capture a photo using your camera</li>
              <li>• Your photo will be compared with your registered image</li>
              <li>• A similarity score of 80% or higher is required</li>
              <li>• The process takes just a few seconds</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={startVerification}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Verification
            </button>
            
            {onCancel && (
              <button
                onClick={handleCancel}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Your privacy is protected. Images are only used for verification and are not stored permanently.
          </p>
        </div>
      </div>
    )
  }

  if (currentStep === 'capture') {
    return (
      <div className={className}>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        <FaceCameraCapture
          onCapture={handleImageCapture}
          onCancel={handleCancel}
          isLoading={isProcessing}
        />
      </div>
    )
  }

  if (currentStep === 'verifying') {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto ${className}`}>
        <div className="text-center">
          <div className="bg-blue-50 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying Your Identity
          </h3>
          
          <p className="text-gray-600">
            Please wait while we compare your photo with your registered image...
          </p>
        </div>
      </div>
    )
  }

  if (currentStep === 'result' && verificationResult) {
    return (
      <div className={className}>
        <FaceVerificationResult
          result={verificationResult}
          onRetry={handleRetry}
          onProceed={verificationResult.success ? handleProceed : undefined}
          onCancel={verificationResult.success ? undefined : (verificationResult.shouldFlag ? handleFailure : handleCancel)}
          isRetrying={isProcessing}
        />
      </div>
    )
  }

  return null
}

export default FaceVerificationFlow