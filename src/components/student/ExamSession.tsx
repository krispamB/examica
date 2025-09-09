'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  Send,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import type {
  ExamSessionWithDetails,
  SubmitResponseRequest,
} from '@/lib/exam-sessions/service'

interface ExamSessionProps {
  sessionId: string
  onSessionComplete: () => void
  onSessionError: (error: string) => void
}

interface SessionProgress {
  totalQuestions: number
  answeredQuestions: number
  timeElapsed: number
  timeRemaining: number | null
  completionPercentage: number
}

const ExamSession: React.FC<ExamSessionProps> = ({
  sessionId,
  onSessionComplete,
  onSessionError,
}) => {
  const [session, setSession] = useState<ExamSessionWithDetails | null>(null)
  const [progress, setProgress] = useState<SessionProgress | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, unknown>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/exam-sessions/${sessionId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load session')
      }

      setSession(data.session)

      // Load existing responses
      const existingResponses: Record<string, unknown> = {}
      data.session.question_responses?.forEach(
        (resp: { question_id: string; response: unknown }) => {
          existingResponses[resp.question_id] = resp.response
        }
      )
      setResponses(existingResponses)

      setIsPaused(data.session.status === 'paused')
    } catch (err) {
      console.error('Load session error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load session')
      onSessionError(
        err instanceof Error ? err.message : 'Failed to load session'
      )
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, onSessionError])

  const loadProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/exam-sessions/${sessionId}/progress`)
      const data = await response.json()

      if (response.ok && data.success) {
        setProgress(data.progress)
        setTimeLeft(data.progress.timeRemaining)
      }
    } catch (err) {
      console.error('Load progress error:', err)
    }
  }, [sessionId])

  const startProgressUpdates = useCallback(() => {
    loadProgress()
    // Update every 30 seconds instead of 5 seconds to reduce server load
    progressIntervalRef.current = setInterval(loadProgress, 30000)
  }, [loadProgress])

  const stopProgressUpdates = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [])

  // Load session data
  useEffect(() => {
    loadSession()
    startProgressUpdates()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      stopProgressUpdates() // Use the cleanup function
    }
  }, [loadSession, startProgressUpdates, stopProgressUpdates])

  const handleCompleteSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/exam-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'complete' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete session')
      }

      stopProgressUpdates() // Stop polling when exam completes
      onSessionComplete()
    } catch (err) {
      console.error('Complete session error:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to complete session'
      )
    }
  }, [sessionId, onSessionComplete, stopProgressUpdates])

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleTimeUp = useCallback(async () => {
    stopTimer()
    try {
      await handleCompleteSession()
    } catch (err) {
      console.error('Auto-complete session error:', err)
    }
  }, [handleCompleteSession])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null
        if (prev <= 0) {
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [handleTimeUp])

  useEffect(() => {
    if (!isPaused && timeLeft !== null && session?.status === 'active') {
      startTimer()
    } else {
      stopTimer()
    }

    return stopTimer
  }, [isPaused, timeLeft, session?.status, startTimer])

  const handleResponseChange = (questionId: string, response: unknown) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: response,
    }))
  }

  const submitResponse = async (questionId: string, response: unknown) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const submitRequest: SubmitResponseRequest = {
        sessionId,
        questionId,
        response,
      }

      const apiResponse = await fetch(
        `/api/exam-sessions/${sessionId}/responses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitRequest),
        }
      )

      const data = await apiResponse.json()

      if (!apiResponse.ok) {
        throw new Error(data.error || 'Failed to submit response')
      }

      // Refresh progress
      loadProgress()
    } catch (err) {
      console.error('Submit response error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit response')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePauseResume = async () => {
    try {
      const action = isPaused ? 'resume' : 'pause'

      const response = await fetch(`/api/exam-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} session`)
      }

      setIsPaused(!isPaused)
      if (isPaused) {
        // Resuming exam
        startTimer()
        startProgressUpdates()
      } else {
        // Pausing exam
        stopTimer()
        stopProgressUpdates()
      }
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
          // Validate that options exists and is an array
          if (!question.options || !Array.isArray(question.options)) {
            console.warn(
              `Multiple choice question ${questionId} has invalid options:`,
              question.options
            )
            return (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  ⚠️ This question has invalid options and cannot be displayed
                  properly. Please contact your instructor.
                </p>
              </div>
            )
          }

          // Check if options array is empty
          if (question.options.length === 0) {
            console.warn(
              `Multiple choice question ${questionId} has no options`
            )
            return (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ This question has no answer options available.
                </p>
              </div>
            )
          }

          try {
            return (
              <div className="space-y-3">
                {question.options.map(
                  (
                    option:
                      | string
                      | { id: string; text: string; isCorrect: boolean },
                    index: number
                  ) => {
                    // Handle both string arrays and object arrays
                    const optionText =
                      typeof option === 'string'
                        ? option
                        : option?.text || `Option ${index + 1}`
                    const optionValue =
                      typeof option === 'string'
                        ? option
                        : option?.text || `option_${index}`

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
                          onChange={(e) => {
                            handleResponseChange(questionId, e.target.value)
                            submitResponse(questionId, e.target.value)
                          }}
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-foreground">{optionText}</span>
                      </label>
                    )
                  }
                )}
              </div>
            )
          } catch (error) {
            console.error(
              `Error rendering multiple choice options for question ${questionId}:`,
              error
            )
            return (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  ⚠️ Error displaying question options. Please try refreshing
                  the page.
                </p>
              </div>
            )
          }

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
                    onChange={(e) => {
                      handleResponseChange(questionId, e.target.value)
                      submitResponse(questionId, e.target.value)
                    }}
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
                value={currentResponse}
                onChange={(e) =>
                  handleResponseChange(questionId, e.target.value)
                }
                onBlur={() => submitResponse(questionId, currentResponse)}
                placeholder="Enter your essay response here..."
                rows={8}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-vertical"
              />
              <Button
                onClick={() => submitResponse(questionId, currentResponse)}
                disabled={isSubmitting}
                size="sm"
                className="ml-auto"
              >
                <Send className="w-4 h-4 mr-1" />
                Save Response
              </Button>
            </div>
          )

        case 'fill_blank':
          return (
            <div className="space-y-3">
              <input
                type="text"
                value={currentResponse}
                onChange={(e) =>
                  handleResponseChange(questionId, e.target.value)
                }
                onBlur={() => submitResponse(questionId, currentResponse)}
                placeholder="Enter your answer here..."
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <Button
                onClick={() => submitResponse(questionId, currentResponse)}
                disabled={isSubmitting}
                size="sm"
                className="ml-auto"
              >
                <Send className="w-4 h-4 mr-1" />
                Save Response
              </Button>
            </div>
          )

        default:
          return (
            <div className="space-y-3">
              <textarea
                value={currentResponse}
                onChange={(e) =>
                  handleResponseChange(questionId, e.target.value)
                }
                onBlur={() => submitResponse(questionId, currentResponse)}
                placeholder="Enter your response here..."
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-vertical"
              />
              <Button
                onClick={() => submitResponse(questionId, currentResponse)}
                disabled={isSubmitting}
                size="sm"
                className="ml-auto"
              >
                <Send className="w-4 h-4 mr-1" />
                Save Response
              </Button>
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
            ⚠️ Error displaying this question. Please try refreshing the page or
            contact your instructor.
          </p>
          <details className="mt-2">
            <summary className="text-xs text-red-600 cursor-pointer">
              Technical Details
            </summary>
            <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap">
              Question ID: {questionId}
              Type: {question.type}
              Error: {error instanceof Error ? error.message : String(error)}
            </pre>
          </details>
        </div>
      )
    }
  }

  if (isLoading) {
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
        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-secondary">
              <span>Progress: {progress.completionPercentage}%</span>
              <span>
                {progress.answeredQuestions} of {progress.totalQuestions}{' '}
                answered
              </span>
            </div>
            <div className="w-full bg-background-tertiary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.completionPercentage}%` }}
              />
            </div>
          </div>
        )}
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
              {currentQuestion.required && (
                <span className="text-xs bg-error-light text-error px-2 py-1 rounded">
                  Required
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
              <span>Response saved</span>
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
            <Button onClick={handleCompleteSession} variant="primary">
              Complete Exam
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
