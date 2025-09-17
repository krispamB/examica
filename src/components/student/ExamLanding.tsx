'use client'

import React, { useState } from 'react'
import {
  Play,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Camera,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import FaceCaptureCamera from '@/components/common/FaceCaptureCamera'
import type { ExamWithQuestions } from '@/lib/exams/service'

interface ExamLandingProps {
  exam: ExamWithQuestions
  onStartExam: (sessionId: string) => void
}

interface VerificationResult {
  success: boolean
  similarity: number
  verified: boolean
  message?: string
  error?: string
}

const ExamLanding: React.FC<ExamLandingProps> = ({ exam, onStartExam }) => {
  const [step, setStep] = useState<'overview' | 'verification' | 'starting'>(
    'overview'
  )
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCaptureComplete = async (base64: string) => {
    try {
      setError(null)

      // Verify identity
      const response = await fetch('/api/verify-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          liveCaptureBase64: base64,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      const result = {
        success: data.verification.success,
        similarity: data.verification.similarity,
        verified: data.verification.success,
        message: data.verification.message,
      }

      setVerificationResult(result)

      if (result.verified) {
        // Proceed to start exam
        setTimeout(() => {
          handleStartExam()
        }, 2000) // Show success message for 2 seconds
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  const handleStartExam = async () => {
    if (isStarting) return

    setIsStarting(true)
    setStep('starting')
    setError(null)

    try {
      console.log('ExamLanding: Starting exam process')

      // Skip redundant session check - ExamClient already verified no active session exists
      // If we're here, either no session exists or verification is needed

      let sessionToUse = null

      // Only check for existing sessions if verification is required
      if (exam.requires_verification) {
        console.log('ExamLanding: Checking for existing unverified session')
        const checkResponse = await fetch(
          `/api/exam-sessions?exam_id=${exam.id}&status=active`
        )

        if (checkResponse.ok) {
          const checkData = await checkResponse.json()

          if (
            checkData.success &&
            checkData.sessions &&
            checkData.sessions.length > 0
          ) {
            // Found existing session that needs verification completion
            const existingSession = checkData.sessions[0]
            console.log(
              'ExamLanding: Found existing session for verification:',
              existingSession.id
            )

            // Update the session metadata to mark verification as completed
            const updateResponse = await fetch(
              `/api/exam-sessions/${existingSession.id}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  action: 'update_metadata',
                  metadata: {
                    ...existingSession.metadata,
                    verification_completed: true,
                  },
                }),
              }
            )

            const updateData = await updateResponse.json()

            if (!updateResponse.ok) {
              throw new Error(updateData.error || 'Failed to update session')
            }

            sessionToUse = existingSession.id
          }
        }
      }

      if (sessionToUse) {
        // Use existing verified session
        console.log('ExamLanding: Using existing session:', sessionToUse)
        onStartExam(sessionToUse)
        return
      }

      // No existing session found, create new session
      console.log('ExamLanding: Creating new session')
      const response = await fetch('/api/exam-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examId: exam.id,
          requiresFacialVerification: exam.requires_verification,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start exam')
      }

      console.log('ExamLanding: Created new session:', data.session.id)
      onStartExam(data.session.id)
    } catch (err) {
      console.error('Start exam error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start exam')
      setStep('overview')
    } finally {
      setIsStarting(false)
    }
  }

  const handleProceedToVerification = () => {
    if (exam.requires_verification) {
      setStep('verification')
    } else {
      handleStartExam()
    }
  }

  const renderOverview = () => (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-background rounded-lg border border-border p-8">
        {/* Exam Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {exam.title}
          </h1>
          {exam.description && (
            <p className="text-secondary text-lg">{exam.description}</p>
          )}
        </div>

        {/* Exam Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4 bg-background-secondary rounded-lg">
            <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-sm text-secondary">Questions</div>
            <div className="text-xl font-semibold text-foreground">
              {exam.question_count || 0}
            </div>
          </div>

          <div className="text-center p-4 bg-background-secondary rounded-lg">
            <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-sm text-secondary">Duration</div>
            <div className="text-xl font-semibold text-foreground">
              {exam.duration ? `${exam.duration} minutes` : 'Unlimited'}
            </div>
          </div>

          <div className="text-center p-4 bg-background-secondary rounded-lg">
            <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-sm text-secondary">Total Points</div>
            <div className="text-xl font-semibold text-foreground">
              {exam.total_points || 0}
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Exam Requirements
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary-light text-primary rounded-full flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <span className="text-foreground">
                Complete all questions within the time limit
              </span>
            </div>

            {exam.requires_verification && (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-warning-light text-warning rounded-full flex items-center justify-center text-xs">
                  <Camera className="w-3 h-3" />
                </div>
                <span className="text-foreground">
                  Facial verification required before starting
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-info-light text-info rounded-full flex items-center justify-center text-xs font-bold">
                !
              </div>
              <span className="text-foreground">
                Maintain academic integrity throughout the exam
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-info-light border border-info/20 rounded-lg p-4 mb-8">
          <h4 className="font-medium text-info mb-2">Important Instructions</h4>
          <ul className="text-sm text-info space-y-1">
            <li>• Ensure you have a stable internet connection</li>
            <li>• Do not refresh the page or navigate away during the exam</li>
            <li>• Your responses are automatically saved</li>
            <li>• You can pause the exam if needed (time will continue)</li>
            <li>• Submit your exam before the time limit expires</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error-light border border-error/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-error" />
              <span className="font-medium text-error">Error</span>
            </div>
            <p className="text-sm text-error mt-1">{error}</p>
          </div>
        )}

        {/* Start Button */}
        <div className="text-center">
          <Button
            onClick={handleProceedToVerification}
            disabled={isStarting}
            size="lg"
            className="px-8 py-3"
          >
            <Play className="w-5 h-5 mr-2" />
            {exam.requires_verification
              ? 'Proceed to Verification'
              : 'Start Exam'}
          </Button>
        </div>
      </div>
    </div>
  )

  const renderVerification = () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-background rounded-lg border border-border p-8">
        <div className="text-center mb-8">
          <Camera className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Identity Verification
          </h2>
          <p className="text-secondary">
            Please take a clear photo of your face to verify your identity
            before starting the exam.
          </p>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              verificationResult.verified
                ? 'bg-success-light border-success/20'
                : 'bg-error-light border-error/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {verificationResult.verified ? (
                <CheckCircle className="w-5 h-5 text-success" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-error" />
              )}
              <span
                className={`font-medium ${
                  verificationResult.verified ? 'text-success' : 'text-error'
                }`}
              >
                {verificationResult.verified
                  ? 'Verification Successful'
                  : 'Verification Failed'}
              </span>
            </div>
            <p
              className={`text-sm ${
                verificationResult.verified ? 'text-success' : 'text-error'
              }`}
            >
              {verificationResult.message ||
                (verificationResult.verified
                  ? 'Starting exam in a moment...'
                  : 'Please try again or contact support.')}
            </p>
            {!verificationResult.verified && (
              <p className="text-xs text-secondary mt-1">
                Similarity: {(verificationResult.similarity * 100).toFixed(1)}%
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-error-light border border-error/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-error" />
              <span className="font-medium text-error">Verification Error</span>
            </div>
            <p className="text-sm text-error mt-1">{error}</p>
          </div>
        )}

        {/* Face Capture */}
        {!verificationResult?.verified && (
          <FaceCaptureCamera
            onCapture={handleCaptureComplete}
            isLoading={!!verificationResult && !verificationResult.verified}
          />
        )}

        {/* Back Button */}
        <div className="text-center mt-6">
          <Button
            onClick={() => {
              setStep('overview')
              setVerificationResult(null)
              setError(null)
            }}
            variant="ghost"
            disabled={verificationResult?.verified}
          >
            Back to Overview
          </Button>
        </div>
      </div>
    </div>
  )

  const renderStarting = () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-background rounded-lg border border-border p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Starting Your Exam
        </h2>
        <p className="text-secondary">
          Please wait while we prepare your exam session...
        </p>
      </div>
    </div>
  )

  switch (step) {
    case 'verification':
      return renderVerification()
    case 'starting':
      return renderStarting()
    default:
      return renderOverview()
  }
}

export default ExamLanding
