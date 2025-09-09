'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ExamLanding from '@/components/student/ExamLanding'
import ExamSession from '@/components/student/ExamSession'
import type { ExamWithQuestions } from '@/lib/exams/service'

interface ExamClientProps {
  exam: ExamWithQuestions
}

const ExamClient: React.FC<ExamClientProps> = ({ exam }) => {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [step, setStep] = useState<
    'loading' | 'landing' | 'session' | 'completed'
  >('loading')
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()

  // Check for existing active session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const response = await fetch(
          `/api/exam-sessions?exam_id=${exam.id}&status=active`
        )

        if (!response.ok) {
          throw new Error('Failed to check existing sessions')
        }

        const data = await response.json()

        if (data.success && data.sessions && data.sessions.length > 0) {
          // Found an active session, navigate directly to it
          const activeSession = data.sessions[0]
          setSessionId(activeSession.id)
          setStep('session')
        } else {
          // No active session found, show landing page
          setStep('landing')
        }
      } catch (error) {
        console.error('Error checking existing session:', error)
        // On error, default to landing page
        setStep('landing')
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkExistingSession()
  }, [exam.id])

  const handleStartExam = (newSessionId: string) => {
    setSessionId(newSessionId)
    setStep('session')
  }

  const handleSessionComplete = () => {
    setStep('completed')
    // Redirect to results page after a short delay
    setTimeout(() => {
      router.push('/student/exams')
    }, 3000)
  }

  const handleSessionError = (error: string) => {
    console.error('Exam session error:', error)
    // Redirect back to exams list
    router.push('/student/exams')
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

  if (step === 'session' && sessionId) {
    return (
      <ExamSession
        sessionId={sessionId}
        onSessionComplete={handleSessionComplete}
        onSessionError={handleSessionError}
      />
    )
  }

  return <ExamLanding exam={exam} onStartExam={handleStartExam} />
}

export default ExamClient
