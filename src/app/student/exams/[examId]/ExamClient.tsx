'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ExamLanding from '@/components/student/ExamLanding'
import ExamSession from '@/components/student/ExamSession'
import type { ExamWithPartialQuestions } from '@/lib/exams/service'
import type { ExamSessionWithDetails } from '@/lib/exam-sessions/service'

interface ExamClientProps {
  exam: ExamWithPartialQuestions
}

const ExamClient: React.FC<ExamClientProps> = ({ exam }) => {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<ExamSessionWithDetails | null>(
    null
  )
  const [step, setStep] = useState<
    'loading' | 'landing' | 'session' | 'completed'
  >('loading')
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [hasCheckedSession, setHasCheckedSession] = useState(false)
  const router = useRouter()

  const handleSessionError = useCallback(
    (error: string) => {
      console.error('Exam session error:', error)
      // Redirect back to exams list
      router.push('/student/exams')
    },
    [router]
  )

  // Load full session data for the exam session
  const loadSessionData = useCallback(
    async (sessionId: string) => {
      try {
        const response = await fetch(`/api/exam-sessions/${sessionId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load session')
        }

        setSessionData(data.session)
        setStep('session')
      } catch (error) {
        console.error('Error loading session data:', error)
        handleSessionError('Failed to load exam session')
      }
    },
    [handleSessionError]
  )

  // Check for existing active session on mount - only once
  useEffect(() => {
    if (hasCheckedSession) return

    const checkExistingSession = async () => {
      console.log('ExamClient: Checking for existing session (one-time check)')
      try {
        const response = await fetch(
          `/api/exam-sessions?exam_id=${exam.id}&status=active`
        )

        if (!response.ok) {
          throw new Error('Failed to check existing sessions')
        }

        const data = await response.json()

        if (data.success && data.sessions && data.sessions.length > 0) {
          const existingSession = data.sessions[0]
          console.log('ExamClient: Found existing session:', existingSession.id)

          // Check if verification is required and not completed
          if (
            exam.requires_verification &&
            !existingSession.metadata?.verification_completed
          ) {
            // Session exists but needs verification, show landing page
            setStep('landing')
          } else {
            // Session is verified or doesn't need verification, load session details
            setSessionId(existingSession.id)
            await loadSessionData(existingSession.id)
          }
        } else {
          console.log(
            'ExamClient: No active session found, showing landing page'
          )
          // No active session found, show landing page
          setStep('landing')
        }
      } catch (error) {
        console.error('Error checking existing session:', error)
        // On error, default to landing page
        setStep('landing')
      } finally {
        setIsCheckingSession(false)
        setHasCheckedSession(true)
      }
    }

    checkExistingSession()
  }, [exam.id, exam.requires_verification, loadSessionData, hasCheckedSession])

  const handleStartExam = async (newSessionId: string) => {
    setSessionId(newSessionId)
    await loadSessionData(newSessionId)
  }

  const handleSessionComplete = () => {
    setStep('completed')
    // Redirect to results page after a short delay
    setTimeout(() => {
      router.push('/student/exams')
    }, 3000)
  }

  if (step === 'loading' || isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 text-center">
          <div className="bg-background rounded-lg border border-border p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Loading Exam
            </h2>
            <p className="text-secondary">Checking for existing session...</p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 text-center">
          <div className="bg-background rounded-lg border border-border p-8">
            <div className="w-16 h-16 bg-success-light text-success rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Exam Completed!
            </h2>
            <p className="text-secondary mb-6">
              Your responses have been submitted successfully. You will be
              redirected shortly.
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'session' && sessionId && sessionData) {
    return (
      <ExamSession
        sessionId={sessionId}
        initialSession={sessionData}
        onSessionComplete={handleSessionComplete}
        onSessionError={handleSessionError}
      />
    )
  }

  return <ExamLanding exam={exam} onStartExam={handleStartExam} />
}

export default ExamClient
