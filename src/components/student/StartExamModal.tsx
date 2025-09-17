'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Database } from '@/types/database.types'
import { formatDuration } from '@/lib/utils'

type Exam = Database['public']['Tables']['exams']['Row']

interface StartExamModalProps {
  exam: Exam
  userProfile: Database['public']['Tables']['user_profiles']['Row'] | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const StartExamModal: React.FC<StartExamModalProps> = ({
  exam,
  userProfile,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationStep, setVerificationStep] = useState<
    'confirm' | 'success'
  >('confirm')
  const supabase = createClient()

  const handleStartExam = async () => {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      if (!userProfile) {
        throw new Error('User profile not found')
      }

      // Create new exam session
      const { data: session, error: sessionError } = await supabase
        .from('exam_sessions')
        .insert({
          exam_id: exam.id,
          user_id: user.id, // Use authenticated user ID instead of userProfile.id
          status: 'active', // Always use active status
          started_at: new Date().toISOString(),
          time_remaining: exam.duration ? exam.duration * 60 : null, // Convert minutes to seconds
          current_question_index: 0,
          answers: {},
          metadata: {
            verification_completed: !exam.requires_verification, // False if verification required
            started_from: 'student_portal',
          },
        })
        .select()
        .single()

      if (sessionError || !session) {
        console.error('Exam session creation error:', sessionError)
        throw new Error(
          sessionError?.message || 'Failed to create exam session'
        )
      }

      // Redirect to exam
      window.location.href = `/student/exams/${exam.id}`

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start exam')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmStart = () => {
    // Always go directly to start exam - verification will happen in ExamLanding
    handleStartExam()
  }

  const handleClose = () => {
    setVerificationStep('confirm')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">
              {verificationStep === 'confirm' && 'Start Exam'}
              {verificationStep === 'success' && 'Starting Exam'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              disabled={loading}
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-error-light border border-error/20 text-error px-4 py-3 rounded-md">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Confirmation Step */}
          {verificationStep === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-primary-light border border-primary/20 text-primary px-4 py-3 rounded-md">
                <h3 className="font-medium">{exam.title}</h3>
                <p className="text-sm mt-1">{exam.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {exam.duration && (
                  <div>
                    <span className="font-medium text-foreground">
                      Duration:
                    </span>
                    <span className="ml-2 text-secondary">
                      {formatDuration(exam.duration)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-foreground">
                    Max Attempts:
                  </span>
                  <span className="ml-2 text-secondary">
                    {exam.max_attempts || 1}
                  </span>
                </div>
                {exam.pass_threshold && (
                  <div>
                    <span className="font-medium text-foreground">
                      Pass Score:
                    </span>
                    <span className="ml-2 text-secondary">
                      {exam.pass_threshold}%
                    </span>
                  </div>
                )}
                {exam.requires_verification && (
                  <div>
                    <span className="font-medium text-foreground">
                      Verification:
                    </span>
                    <span className="ml-2 text-warning">Required</span>
                  </div>
                )}
              </div>

              {exam.instructions && (
                <div className="mt-4">
                  <h4 className="font-medium text-foreground mb-2">
                    Instructions:
                  </h4>
                  <div className="text-sm text-secondary bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">
                      {exam.instructions}
                    </pre>
                  </div>
                </div>
              )}

              {exam.requires_verification && (
                <div className="bg-info-light border border-info/20 text-info-dark px-4 py-3 rounded-md">
                  <p className="font-medium">Identity Verification Required</p>
                  <p className="text-sm mt-1">
                    This exam requires facial verification. You will be prompted
                    to verify your identity before starting the exam.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmStart}
                  loading={loading}
                  disabled={loading}
                  className="flex-1"
                >
                  Start Exam
                </Button>
              </div>
            </div>
          )}

          {/* Success Step */}
          {verificationStep === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-primary mb-2">
                Creating Exam Session
              </h3>
              <p className="text-sm text-secondary">Redirecting to exam...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StartExamModal
