'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import type { ExamSessionWithDetails } from '@/lib/exam-sessions/service'

// Request tracking for debugging
const activeRequests = new Set<string>()
const logRequest = (url: string, method: string) => {
  const requestId = `${method}:${url}`
  if (activeRequests.has(requestId)) {
    console.warn(`🚨 ExamSession: Duplicate request detected: ${requestId}`)
    return false
  }
  activeRequests.add(requestId)
  console.log(`🌐 ExamSession: API Request: ${requestId}`)
  return true
}
const clearRequest = (url: string, method: string) => {
  const requestId = `${method}:${url}`
  activeRequests.delete(requestId)
}

interface ExamSessionProps {
  sessionId: string
  initialSession: ExamSessionWithDetails
  onSessionComplete: () => void
  onSessionError: (error: string) => void
}

interface SessionProgress {
  totalQuestions: number
  answeredQuestions: number
  completionPercentage: number
}

const ExamSession: React.FC<ExamSessionProps> = ({
  sessionId,
  initialSession,
  onSessionComplete,
  onSessionError,
}) => {
  const [session] = useState<ExamSessionWithDetails>(initialSession)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, unknown>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isClientMounted, setIsClientMounted] = useState(false)
  const [progress, setProgress] = useState<SessionProgress>({
    totalQuestions: session?.exams.exam_questions?.length || 0,
    answeredQuestions: 0,
    completionPercentage: 0,
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setIsClientMounted(true)
  }, [])

  // Update progress based on current answers
  const updateProgress = useCallback(
    (currentResponses: Record<string, unknown>) => {
      const totalQuestions = session?.exams.exam_questions?.length || 0
      const answeredQuestions = Object.keys(currentResponses).length
      const completionPercentage =
        totalQuestions > 0
          ? Math.round((answeredQuestions / totalQuestions) * 100)
          : 0

      setProgress({
        totalQuestions,
        answeredQuestions,
        completionPercentage,
      })
    },
    [session]
  )

  // Load answers from Redis once on exam start (with client-side caching)
  const loadAnswersFromRedis = useCallback(async () => {
    try {
      console.log(
        `ExamSession: Loading answers from Redis for session ${sessionId}`
      )
      const response = await fetch(
        `/api/exam-sessions/${sessionId}/redis-answers`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || `HTTP ${response.status}: Failed to load answers`
        )
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to retrieve answers from Redis')
      }

      if (data.answers) {
        console.log(
          `ExamSession: Cached ${Object.keys(data.answers).length} answers from Redis for session ${sessionId}`
        )
        setResponses(data.answers)
        updateProgress(data.answers)
      } else {
        console.log(
          `ExamSession: No existing answers found in Redis for session ${sessionId}`
        )
        setResponses({})
        updateProgress({})
      }
    } catch (err) {
      console.error('ExamSession: Failed to load answers from Redis:', err)
      // Don't throw here - missing Redis data shouldn't block the exam
      setResponses({})
      updateProgress({})
    }
  }, [sessionId, updateProgress])

  // Load existing answers and set initial state
  useEffect(() => {
    if (!isClientMounted) return
    const loadSessionData = async () => {
      try {
        // Load existing answers from Redis once (then cache in React state)
        await loadAnswersFromRedis()

        // Set initial time
        if (session.exams.duration) {
          setTimeLeft(session.exams.duration * 60)
        }
      } catch (err) {
        console.error('Failed to load session data:', err)
        setError('Failed to load exam session data')
        onSessionError('Failed to load exam session data')
      }
    }

    loadSessionData()
  }, [
    sessionId,
    session.id,
    session.exams.duration,
    isClientMounted,
    loadAnswersFromRedis,
    onSessionError,
  ])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleCompleteSession = useCallback(async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      console.log(
        `ExamSession: Submitting ${Object.keys(responses).length} cached answers for completion`
      )

      // Check for duplicate request
      const completionUrl = `/api/exam-sessions/${sessionId}/complete`
      if (!logRequest(completionUrl, 'POST')) {
        console.warn(
          'ExamSession: Completion request already in progress, skipping duplicate'
        )
        setIsSubmitting(false)
        return
      }

      // Complete session - Redis data will be transferred to database by server
      const response = await fetch(completionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      clearRequest(completionUrl, 'POST')

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete session')
      }

      console.log(
        `ExamSession: Successfully completed session ${sessionId} - Redis data transferred to database`
      )

      stopTimer()
      onSessionComplete()
    } catch (err) {
      console.error('Complete session error:', err)
      clearRequest(`/api/exam-sessions/${sessionId}/complete`, 'POST')
      setError(
        err instanceof Error ? err.message : 'Failed to complete session'
      )
      setIsSubmitting(false)
    }
  }, [sessionId, isSubmitting, onSessionComplete, stopTimer, responses])

  // Timer functionality
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null
        if (prev <= 0) {
          handleCompleteSession()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [handleCompleteSession])

  useEffect(() => {
    if (!isPaused && timeLeft !== null && session?.status === 'active') {
      startTimer()
    } else {
      stopTimer()
    }

    return stopTimer
  }, [isPaused, timeLeft, session.status, startTimer, stopTimer])

  // Handle answer changes - immediate Redis save + client cache update
  const handleResponseChange = async (
    questionId: string,
    response: unknown
  ) => {
    console.log(`ExamSession: Answer changed for question ${questionId}`)

    // Update client-side cache immediately for instant UI response
    const newResponses = {
      ...responses,
      [questionId]: response,
    }
    setResponses(newResponses)
    updateProgress(newResponses)

    // Save to Redis immediately (but don't re-fetch) with deduplication
    try {
      const saveUrl = '/api/exam-sessions/save-answer'
      const requestKey = `${saveUrl}:${questionId}`

      if (!logRequest(requestKey, 'POST')) {
        console.log(
          `ExamSession: Skipping duplicate save request for question ${questionId}`
        )
        return
      }

      const saveResponse = await fetch(saveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId,
          answer: response,
        }),
      })

      clearRequest(requestKey, 'POST')

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json()
        throw new Error(
          errorData.error ||
            `HTTP ${saveResponse.status}: Failed to save answer`
        )
      }

      const data = await saveResponse.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to save answer to Redis')
      }

      console.log(
        `ExamSession: Saved answer for question ${questionId} to Redis session ${sessionId}`
      )
    } catch (err) {
      console.error('ExamSession: Failed to save answer to Redis:', err)
      clearRequest(`/api/exam-sessions/save-answer:${questionId}`, 'POST')
      setError(
        `Failed to save answer: ${err instanceof Error ? err.message : 'Unknown error'}`
      )

      // Show user-friendly error but don't block the exam
      setTimeout(() => setError(null), 5000)
    }
  }

  const handlePauseResume = async () => {
    try {
      const action = isPaused ? 'resume' : 'pause'

      const response = await fetch(`/api/exam-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} session`)
      }

      setIsPaused(!isPaused)
    } catch (err) {
      console.error('Pause/Resume error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update session')
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const renderQuestionInput = (question: {
    id: string
    type: string
    content: string
    options?: unknown
  }) => {
    const questionId = question.id
    const currentResponse = responses[questionId] || ''

    try {
      switch (question.type) {
        case 'multiple_choice':
          if (!question.options || !Array.isArray(question.options)) {
            return (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  ⚠️ This question has invalid options and cannot be displayed
                  properly.
                </p>
              </div>
            )
          }

          if (question.options.length === 0) {
            return (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ This question has no answer options available.
                </p>
              </div>
            )
          }

          return (
            <div className="space-y-3">
              {question.options.map(
                (
                  option:
                    | string
                    | { id: string; text: string; isCorrect: boolean },
                  index: number
                ) => {
                  const optionText =
                    typeof option === 'string'
                      ? option
                      : option?.text || `Option ${index + 1}`
                  const optionValue =
                    typeof option === 'string'
                      ? option
                      : option?.id || `option_${index}`

                  return (
                    <label
                      key={index}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={questionId}
                        value={optionValue}
                        checked={currentResponse === optionValue}
                        onChange={(e) =>
                          handleResponseChange(questionId, e.target.value)
                        }
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-foreground">{optionText}</span>
                    </label>
                  )
                }
              )}
            </div>
          )

        case 'true_false':
          return (
            <div className="space-y-3">
              {['True', 'False'].map((option) => (
                <label
                  key={option}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={questionId}
                    value={option.toLowerCase()}
                    checked={currentResponse === option.toLowerCase()}
                    onChange={(e) =>
                      handleResponseChange(questionId, e.target.value)
                    }
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-foreground">{option}</span>
                </label>
              ))}
            </div>
          )

        case 'essay':
          return (
            <div className="space-y-3">
              <textarea
                value={currentResponse as string}
                onChange={(e) =>
                  handleResponseChange(questionId, e.target.value)
                }
                placeholder="Enter your essay response here..."
                rows={8}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-vertical"
              />
            </div>
          )

        case 'fill_blank':
          return (
            <div className="space-y-3">
              <input
                type="text"
                value={currentResponse as string}
                onChange={(e) =>
                  handleResponseChange(questionId, e.target.value)
                }
                placeholder="Enter your answer here..."
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          )

        default:
          return (
            <div className="space-y-3">
              <textarea
                value={currentResponse as string}
                onChange={(e) =>
                  handleResponseChange(questionId, e.target.value)
                }
                placeholder="Enter your response here..."
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-vertical"
              />
            </div>
          )
      }
    } catch (error) {
      console.error(
        `Error rendering question ${questionId} of type ${question.type}:`,
        error
      )
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            ⚠️ Error displaying this question. Please try refreshing the page.
          </p>
        </div>
      )
    }
  }

  // Show loading until client is mounted to prevent hydration mismatch
  if (!isClientMounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Session Error
        </h3>
        <p className="text-secondary mb-6">{error || 'Session not found'}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  const questions = session.exams.exam_questions || []
  const currentQuestion = questions[currentQuestionIndex]

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No Questions Available
        </h3>
        <p className="text-secondary">This exam has no questions.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-background-secondary rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {session.exams.title}
            </h1>
            <p className="text-secondary">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                  timeLeft < 300
                    ? 'bg-error-light text-error'
                    : 'bg-background text-foreground'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}

            {/* Pause/Resume */}
            <Button onClick={handlePauseResume} variant="ghost" size="sm">
              {isPaused ? (
                <Play className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-secondary">
            <span>Progress: {progress.completionPercentage}%</span>
            <span>
              {progress.answeredQuestions} of {progress.totalQuestions} answered
            </span>
          </div>
          <div className="w-full bg-background-tertiary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-background rounded-lg border border-border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-secondary">
                {currentQuestion.questions.type.replace('_', ' ').toUpperCase()}
              </span>
              {currentQuestion.points && (
                <span className="text-sm text-secondary">
                  ({currentQuestion.points} points)
                </span>
              )}
            </div>
            <h2 className="text-lg font-medium text-foreground mb-4">
              {currentQuestion.questions.title}
            </h2>
            {currentQuestion.questions.content && (
              <div
                className="prose text-foreground mb-6"
                dangerouslySetInnerHTML={{
                  __html: currentQuestion.questions.content,
                }}
              />
            )}
          </div>
        </div>

        {/* Response Input */}
        <div className="space-y-4">
          {renderQuestionInput(currentQuestion.questions)}

          {/* Response Status */}
          {responses[currentQuestion.questions.id] && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle className="w-4 h-4" />
              <span>Answer saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() =>
            setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
          }
          disabled={currentQuestionIndex === 0}
          variant="ghost"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}>
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleCompleteSession}
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Complete Exam'}
            </Button>
          )}
        </div>
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-8 text-center">
            <Pause className="w-12 h-12 text-warning mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Exam Paused
            </h3>
            <p className="text-secondary mb-6">
              Click Resume to continue your exam
            </p>
            <Button onClick={handlePauseResume}>
              <Play className="w-4 h-4 mr-1" />
              Resume Exam
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExamSession
