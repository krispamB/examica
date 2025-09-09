'use client'

import { useState, useRef, useCallback } from 'react'
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
    'confirm' | 'verify' | 'success'
  >('confirm')
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [verificationLoading, setVerificationLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const supabase = createClient()

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user',
        },
      })
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setError(
        'Camera access denied. Please enable camera permissions and try again.'
      )
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
  }, [cameraStream])

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return null

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext('2d')

    if (!context) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    })
  }, [])

  const handleFacialVerification = async () => {
    setVerificationLoading(true)
    setError(null)

    try {
      const imageBlob = await captureImage()
      if (!imageBlob) {
        throw new Error('Failed to capture image')
      }

      // Convert to base64 for API
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result as string

          // Call facial verification API
          const response = await fetch('/api/verify-identity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              liveCaptureBase64: base64.split(',')[1], // Remove data:image/jpeg;base64, prefix
            }),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Verification failed')
          }

          if (result.verification && result.verification.success) {
            setVerificationStep('success')
            setTimeout(() => {
              handleStartExam()
            }, 1500)
          } else {
            const errorMessage =
              result.verification?.message ||
              'Facial verification failed. Please try again.'
            throw new Error(errorMessage)
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Verification failed')
        } finally {
          setVerificationLoading(false)
        }
      }
      reader.readAsDataURL(imageBlob)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify identity')
      setVerificationLoading(false)
    }
  }

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
          status: 'active', // Use 'active' instead of 'in_progress'
          started_at: new Date().toISOString(),
          time_remaining: exam.duration ? exam.duration * 60 : null, // Convert minutes to seconds
          current_question_index: 0,
          answers: {},
          metadata: {
            verification_completed: exam.requires_verification,
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

      // Stop camera if it was started
      stopCamera()

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
    if (exam.requires_verification) {
      setVerificationStep('verify')
      startCamera()
    } else {
      handleStartExam()
    }
  }

  const handleClose = () => {
    stopCamera()
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
              {verificationStep === 'verify' && 'Identity Verification'}
              {verificationStep === 'success' && 'Verification Successful'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              disabled={loading || verificationLoading}
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
                <div className="bg-warning-light border border-warning/20 text-warning-dark px-4 py-3 rounded-md">
                  <p className="font-medium">Facial Verification Required</p>
                  <p className="text-sm mt-1">
                    This exam requires identity verification through facial
                    recognition. Please ensure you have good lighting and your
                    camera is working.
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
                  {exam.requires_verification ? 'Verify & Start' : 'Start Exam'}
                </Button>
              </div>
            </div>
          )}

          {/* Verification Step */}
          {verificationStep === 'verify' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-foreground mb-2">
                  Position yourself in front of the camera
                </h3>
                <p className="text-sm text-secondary mb-4">
                  Look directly at the camera and ensure your face is clearly
                  visible
                </p>
              </div>

              <div className="flex justify-center">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-80 h-60 bg-gray-100 rounded-lg border"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {!cameraStream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                      <p className="text-gray-500">Starting camera...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  disabled={verificationLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFacialVerification}
                  loading={verificationLoading}
                  disabled={!cameraStream || verificationLoading}
                  className="flex-1"
                >
                  Verify Identity
                </Button>
              </div>
            </div>
          )}

          {/* Success Step */}
          {verificationStep === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success text-white rounded-full flex items-center justify-center mx-auto mb-4">
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
              <h3 className="font-medium text-success mb-2">
                Verification Successful!
              </h3>
              <p className="text-sm text-secondary">Starting your exam...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StartExamModal
