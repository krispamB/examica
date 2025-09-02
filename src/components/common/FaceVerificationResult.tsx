'use client'

import React from 'react'
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'
import type { VerificationResult } from '@/lib/facial-verification/service'

interface FaceVerificationResultProps {
  result: VerificationResult
  onRetry?: () => void
  onProceed?: () => void
  onCancel?: () => void
  isRetrying?: boolean
  showActions?: boolean
  className?: string
}

export const FaceVerificationResult: React.FC<FaceVerificationResultProps> = ({
  result,
  onRetry,
  onProceed,
  onCancel,
  isRetrying = false,
  showActions = true,
  className = ''
}) => {
  const getStatusIcon = () => {
    if (result.success) {
      return <CheckCircle className="w-12 h-12 text-green-500" />
    } else if (result.shouldFlag) {
      return <XCircle className="w-12 h-12 text-red-500" />
    } else {
      return <AlertTriangle className="w-12 h-12 text-orange-500" />
    }
  }

  const getStatusColor = () => {
    if (result.success) {
      return 'text-green-700'
    } else if (result.shouldFlag) {
      return 'text-red-700'
    } else {
      return 'text-orange-700'
    }
  }

  const getBackgroundColor = () => {
    if (result.success) {
      return 'bg-green-50'
    } else if (result.shouldFlag) {
      return 'bg-red-50'
    } else {
      return 'bg-orange-50'
    }
  }

  const getStatusTitle = () => {
    if (result.success) {
      return 'Verification Successful'
    } else if (result.shouldFlag) {
      return 'Verification Failed'
    } else {
      return 'Verification Issue'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto ${className}`}>
      <div className="text-center">
        {/* Status Icon and Background */}
        <div className={`${getBackgroundColor()} rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center`}>
          {getStatusIcon()}
        </div>

        {/* Status Title */}
        <h3 className={`text-xl font-semibold mb-3 ${getStatusColor()}`}>
          {getStatusTitle()}
        </h3>

        {/* Main Message */}
        <p className="text-gray-700 mb-4">
          {result.message}
        </p>

        {/* Verification Details */}
        {(result.similarity > 0 || result.confidence > 0) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Verification Details</h4>
            <div className="space-y-2 text-sm text-gray-600">
              {result.similarity > 0 && (
                <div className="flex justify-between">
                  <span>Similarity Score:</span>
                  <span className={`font-medium ${result.similarity >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                    {result.similarity.toFixed(1)}%
                  </span>
                </div>
              )}
              {result.confidence > 0 && (
                <div className="flex justify-between">
                  <span>Detection Confidence:</span>
                  <span className={`font-medium ${result.confidence >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
                    {result.confidence.toFixed(1)}%
                  </span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span>Required Similarity:</span>
                  <span className="font-medium text-gray-900">≥80%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        {result.shouldFlag && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">
              <strong>Security Notice:</strong> This verification attempt has been flagged for review. 
              Please contact your administrator if you believe this is an error.
            </p>
          </div>
        )}

        {!result.success && !result.shouldFlag && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> Ensure you&apos;re in good lighting, looking directly at the camera, 
              and your face is clearly visible without obstructions.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-col gap-3">
            {result.success && onProceed && (
              <button
                onClick={onProceed}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Continue to Exam
              </button>
            )}

            {!result.success && onRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </>
                )}
              </button>
            )}

            {onCancel && (
              <button
                onClick={onCancel}
                disabled={isRetrying}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                {result.success ? 'Exit' : 'Cancel Verification'}
              </button>
            )}
          </div>
        )}

        {/* Attempt ID for Reference */}
        {result.attemptId && (
          <div className="mt-4 text-xs text-gray-400">
            Attempt ID: {result.attemptId}
          </div>
        )}
      </div>
    </div>
  )
}

export default FaceVerificationResult