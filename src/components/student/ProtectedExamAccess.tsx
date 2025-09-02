'use client'

import React, { useState } from 'react'
import { Shield, Clock, AlertTriangle } from 'lucide-react'
import FaceVerificationFlow from './FaceVerificationFlow'
import useFaceVerification from '@/hooks/useFaceVerification'
import { useRouter } from 'next/navigation'

interface ExamInfo {
  id: string
  title: string
  description?: string
  duration?: number
  instructions?: string
  startTime?: string
  endTime?: string
}

interface ProtectedExamAccessProps {
  exam: ExamInfo
  onExamStart?: () => void
  requiresVerification?: boolean
  className?: string
}

export const ProtectedExamAccess: React.FC<ProtectedExamAccessProps> = ({
  exam,
  onExamStart,
  requiresVerification = true,
  className = ''
}) => {
  const router = useRouter()
  const {
    isVerified,
    isVerifying,
    error,
    lastVerificationTime,
    getVerificationStatus,
    clearVerification,
  } = useFaceVerification()

  const [showVerification, setShowVerification] = useState(false)
  const [examAccessDenied, setExamAccessDenied] = useState(false)

  // Check verification status and exam access
  const verificationStatus = getVerificationStatus()

  // Handle verification success
  const handleVerificationSuccess = () => {
    setShowVerification(false)
    if (onExamStart) {
      onExamStart()
    }
  }

  // Handle verification failure (flagged attempts)
  const handleVerificationFailure = () => {
    setExamAccessDenied(true)
    setShowVerification(false)
  }

  // Handle verification cancellation
  const handleVerificationCancel = () => {
    setShowVerification(false)
    // Optionally redirect back to exam list
    router.push('/student/exams')
  }

  // Start verification process
  const startVerification = () => {
    clearVerification()
    setShowVerification(true)
    setExamAccessDenied(false)
  }

  // Start exam directly (if verification is disabled or already verified)
  const startExamDirectly = () => {
    if (onExamStart) {
      onExamStart()
    }
  }

  // Format verification time
  const formatVerificationTime = (date: Date) => {
    return date.toLocaleString()
  }

  // If showing verification flow
  if (showVerification) {
    return (
      <div className={className}>
        <FaceVerificationFlow
          onSuccess={handleVerificationSuccess}
          onFailed={handleVerificationFailure}
          onCancel={handleVerificationCancel}
          examTitle={exam.title}
        />
      </div>
    )
  }

  // If exam access is denied due to failed verification
  if (examAccessDenied) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto ${className}`}>
        <div className="text-center">
          <div className="bg-red-50 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          
          <h2 className="text-2xl font-semibold text-red-700 mb-4">
            Exam Access Denied
          </h2>
          
          <p className="text-gray-600 mb-6">
            Your identity verification failed multiple times. This attempt has been flagged 
            for security review. Please contact your administrator for assistance.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">
              <strong>Next steps:</strong>
            </p>
            <ul className="text-sm text-red-600 mt-2 space-y-1 text-left">
              <li>• Contact your instructor or administrator</li>
              <li>• Provide your student ID and exam details</li>
              <li>• Wait for manual verification approval</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/student/exams')}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Return to Exams
            </button>
            
            <button
              onClick={startVerification}
              className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
            >
              Try Verification Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main exam access screen
  return (
    <div className={`bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto ${className}`}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{exam.title}</h1>
        {exam.description && (
          <p className="text-gray-600">{exam.description}</p>
        )}
      </div>

      {/* Exam Information */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Exam Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {exam.duration && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Duration: {exam.duration} minutes</span>
            </div>
          )}
          {exam.startTime && (
            <div>
              <strong>Start Time:</strong> {new Date(exam.startTime).toLocaleString()}
            </div>
          )}
          {exam.endTime && (
            <div>
              <strong>End Time:</strong> {new Date(exam.endTime).toLocaleString()}
            </div>
          )}
        </div>
        
        {exam.instructions && (
          <div className="mt-4">
            <strong className="text-gray-900">Instructions:</strong>
            <p className="text-gray-600 mt-1">{exam.instructions}</p>
          </div>
        )}
      </div>

      {/* Verification Status */}
      {requiresVerification && (
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-500" />
            <h3 className="font-semibold text-blue-900">Security Verification Required</h3>
          </div>
          
          {isVerified ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium">Identity Verified</span>
              </div>
              {lastVerificationTime && (
                <p className="text-sm text-green-600">
                  Verified on {formatVerificationTime(lastVerificationTime)}
                </p>
              )}
              <p className="text-sm text-blue-700">
                You can now proceed to start the exam.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-orange-700 font-medium">Verification Required</span>
              </div>
              <p className="text-sm text-blue-700">
                Before starting the exam, you must complete facial recognition verification 
                to confirm your identity.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-4">
        {requiresVerification && !verificationStatus.canAccessExam ? (
          <button
            onClick={startVerification}
            disabled={isVerifying}
            className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying...' : 'Start Identity Verification'}
          </button>
        ) : (
          <button
            onClick={startExamDirectly}
            className="w-full px-8 py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
          >
            Start Exam
          </button>
        )}

        <button
          onClick={() => router.push('/student/exams')}
          className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
        >
          Back to Exams
        </button>
      </div>

      {/* Security Notice */}
      {requiresVerification && (
        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>
            🔒 This exam uses facial recognition for security. Your privacy is protected and 
            verification data is only used for identity confirmation.
          </p>
        </div>
      )}
    </div>
  )
}

export default ProtectedExamAccess