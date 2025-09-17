'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  StopCircle,
  Eye,
  RefreshCw,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import type { ExamSessionWithDetails } from '@/lib/exam-sessions/service'

interface ExamMonitorDashboardProps {
  examId?: string
  className?: string
}

interface SessionStats {
  total: number
  active: number
  completed: number
  paused: number
  terminated: number
}

const ExamMonitorDashboard: React.FC<ExamMonitorDashboardProps> = ({
  examId,
  className = '',
}) => {
  const [sessions, setSessions] = useState<ExamSessionWithDetails[]>([])
  const [stats, setStats] = useState<SessionStats>({
    total: 0,
    active: 0,
    completed: 0,
    paused: 0,
    terminated: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasApiErrors, setHasApiErrors] = useState(false)

  const loadSessions = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) setIsRefreshing(true)
        setError(null)

        const params = new URLSearchParams()
        if (examId) params.append('exam_id', examId)
        params.append('limit', '100') // Show more sessions for monitoring
        params.append('sort_by', 'started_at')
        params.append('sort_order', 'desc')

        const response = await fetch(`/api/exam-sessions?${params}`)

        if (!response.ok) {
          // Handle case where tables don't exist yet
          if (response.status === 500) {
            console.warn('Exam sessions API not ready, using empty data')
            setHasApiErrors(true) // Disable auto-refresh
            setSessions([])
            setStats({
              total: 0,
              active: 0,
              completed: 0,
              paused: 0,
              terminated: 0,
            })
            return // Don't throw error, just return empty data
          }

          const data = await response.json()
          throw new Error(data.error || 'Failed to load sessions')
        }

        const data = await response.json()
        setSessions(data.sessions || [])
        setHasApiErrors(false) // Reset error state on success

        // Calculate stats
        const newStats = (data.sessions || []).reduce(
          (acc: SessionStats, session: ExamSessionWithDetails) => {
            acc.total++
            acc[session.status as keyof SessionStats]++
            return acc
          },
          {
            total: 0,
            active: 0,
            completed: 0,
            paused: 0,
            terminated: 0,
          }
        )

        setStats(newStats)
      } catch (err) {
        console.error('Load sessions error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load sessions')
        setHasApiErrors(true) // Disable auto-refresh on error
        // Set empty data on error to prevent continuous failures
        setSessions([])
        setStats({
          total: 0,
          active: 0,
          completed: 0,
          paused: 0,
          terminated: 0,
        })
      } finally {
        setIsLoading(false)
        if (showRefresh) setIsRefreshing(false)
      }
    },
    [examId]
  )

  useEffect(() => {
    loadSessions()

    // Auto-refresh every 10 seconds for real-time monitoring, but only if no API errors
    let interval: NodeJS.Timeout | undefined
    if (!hasApiErrors) {
      interval = setInterval(() => loadSessions(), 10000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [loadSessions, hasApiErrors])

  const handleSessionAction = async (
    sessionId: string,
    action: string,
    reason?: string
  ) => {
    try {
      const response = await fetch(`/api/exam-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, reason }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} session`)
      }

      // Refresh sessions after action
      loadSessions()
    } catch (err) {
      console.error('Session action error:', err)
      setError(
        err instanceof Error ? err.message : `Failed to ${action} session`
      )
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

  const getTimeElapsed = (startedAt: string): number => {
    const start = new Date(startedAt).getTime()
    const now = new Date().getTime()
    return Math.floor((now - start) / 1000)
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'text-success bg-success-light'
      case 'paused':
        return 'text-warning bg-warning-light'
      case 'completed':
        return 'text-info bg-info-light'
      case 'terminated':
        return 'text-error bg-error-light'
      default:
        return 'text-secondary bg-background-secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />
      case 'paused':
        return <Pause className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'terminated':
        return <StopCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Exam Monitor
          </h2>
          <p className="text-secondary">
            Real-time monitoring of exam sessions
          </p>
        </div>

        <Button
          onClick={() => {
            setHasApiErrors(false) // Reset error state on manual refresh
            loadSessions(true)
          }}
          disabled={isRefreshing}
          variant="ghost"
          size="sm"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          {hasApiErrors ? 'Retry' : 'Refresh'}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error-light border border-error/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-error" />
            <span className="font-medium text-error">Error</span>
          </div>
          <p className="text-sm text-error mt-1">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-secondary">Total</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.total}
          </div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Play className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-secondary">Active</span>
          </div>
          <div className="text-2xl font-bold text-success">{stats.active}</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Pause className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-secondary">Paused</span>
          </div>
          <div className="text-2xl font-bold text-warning">{stats.paused}</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-info" />
            <span className="text-sm font-medium text-secondary">
              Completed
            </span>
          </div>
          <div className="text-2xl font-bold text-info">{stats.completed}</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <StopCircle className="w-4 h-4 text-error" />
            <span className="text-sm font-medium text-secondary">
              Terminated
            </span>
          </div>
          <div className="text-2xl font-bold text-error">
            {stats.terminated}
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">
            Active Sessions
          </h3>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Active Sessions
            </h3>
            <p className="text-secondary">
              No exam sessions are currently running
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">
                    Student
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">
                    Exam
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">
                    Started
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">
                    Duration
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">
                    Progress
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((session) => {
                  const timeElapsed = getTimeElapsed(
                    session.started_at || new Date().toISOString()
                  )
                  const examDuration = session.exams?.duration
                    ? session.exams.duration * 60
                    : null
                  const timeRemaining = examDuration
                    ? Math.max(0, examDuration - timeElapsed)
                    : null
                  const isOvertime = examDuration && timeElapsed > examDuration

                  // Calculate progress based on current question index and total questions
                  const totalQuestions =
                    session.exams?.exam_questions?.length || 0
                  const currentQuestionIndex =
                    session.current_question_index || 0
                  const progressPercentage =
                    totalQuestions > 0
                      ? Math.round(
                          (currentQuestionIndex / totalQuestions) * 100
                        )
                      : 0

                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-background-secondary"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-light text-primary rounded-full flex items-center justify-center text-sm font-medium">
                            {session.user_profiles?.first_name?.[0] || '?'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {session.user_profiles?.first_name}{' '}
                              {session.user_profiles?.last_name}
                            </div>
                            <div className="text-xs text-secondary">
                              {session.user_profiles?.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground">
                          {session.exams?.title}
                        </div>
                        {session.exams?.duration && (
                          <div className="text-xs text-secondary">
                            {session.exams.duration} min limit
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status || 'active')}`}
                        >
                          {getStatusIcon(session.status || 'active')}
                          {(session.status || 'active')
                            .charAt(0)
                            .toUpperCase() +
                            (session.status || 'active').slice(1)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground">
                          {session.started_at
                            ? new Date(session.started_at).toLocaleTimeString()
                            : 'N/A'}
                        </div>
                        <div className="text-xs text-secondary">
                          {session.started_at
                            ? new Date(session.started_at).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div
                          className={`text-sm font-mono ${isOvertime ? 'text-error' : 'text-foreground'}`}
                        >
                          {formatTime(timeElapsed)}
                        </div>
                        {timeRemaining !== null && (
                          <div
                            className={`text-xs ${isOvertime ? 'text-error' : 'text-secondary'}`}
                          >
                            {isOvertime
                              ? 'Overtime'
                              : `${formatTime(timeRemaining)} left`}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-full bg-background-tertiary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-secondary mt-1">
                          {progressPercentage}% complete ({currentQuestionIndex}
                          /{totalQuestions})
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => setSelectedSession(session.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {session.status === 'active' && (
                            <Button
                              onClick={() =>
                                handleSessionAction(
                                  session.id,
                                  'terminate',
                                  'Terminated by examiner'
                                )
                              }
                              variant="ghost"
                              size="sm"
                              className="text-error hover:text-error hover:bg-error-light"
                            >
                              <StopCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Detail Modal would go here */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Session Details
              </h3>
              <Button
                onClick={() => setSelectedSession(null)}
                variant="ghost"
                size="sm"
              >
                ×
              </Button>
            </div>
            <div className="p-6">
              {(() => {
                const session = sessions.find((s) => s.id === selectedSession)
                if (!session)
                  return <p className="text-secondary">Session not found</p>

                const timeElapsed = getTimeElapsed(
                  session.started_at || new Date().toISOString()
                )
                const examDuration = session.exams?.duration
                  ? session.exams.duration * 60
                  : null
                const timeRemaining = examDuration
                  ? Math.max(0, examDuration - timeElapsed)
                  : null
                const totalQuestions =
                  session.exams?.exam_questions?.length || 0
                const currentQuestionIndex = session.current_question_index || 0
                const progressPercentage =
                  totalQuestions > 0
                    ? Math.round((currentQuestionIndex / totalQuestions) * 100)
                    : 0

                return (
                  <div className="space-y-6">
                    {/* Student Info */}
                    <div className="border-b border-border pb-4">
                      <h4 className="text-lg font-semibold text-foreground mb-3">
                        Student Information
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-secondary">Name</label>
                          <p className="text-foreground font-medium">
                            {session.user_profiles?.first_name}{' '}
                            {session.user_profiles?.last_name}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-secondary">
                            Email
                          </label>
                          <p className="text-foreground">
                            {session.user_profiles?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Exam Info */}
                    <div className="border-b border-border pb-4">
                      <h4 className="text-lg font-semibold text-foreground mb-3">
                        Exam Details
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-secondary">
                            Exam Title
                          </label>
                          <p className="text-foreground font-medium">
                            {session.exams?.title}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-secondary">
                            Duration
                          </label>
                          <p className="text-foreground">
                            {session.exams?.duration
                              ? `${session.exams.duration} minutes`
                              : 'No limit'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Session Progress */}
                    <div className="border-b border-border pb-4">
                      <h4 className="text-lg font-semibold text-foreground mb-3">
                        Progress
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-secondary">
                              Questions Answered
                            </span>
                            <span className="text-foreground">
                              {currentQuestionIndex} of {totalQuestions}
                            </span>
                          </div>
                          <div className="w-full bg-background-tertiary rounded-full h-3">
                            <div
                              className="bg-primary h-3 rounded-full transition-all duration-300"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          <div className="text-center text-sm text-secondary mt-1">
                            {progressPercentage}% Complete
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-foreground">
                              {formatTime(timeElapsed)}
                            </div>
                            <div className="text-xs text-secondary">
                              Time Elapsed
                            </div>
                          </div>
                          {timeRemaining !== null && (
                            <div className="text-center">
                              <div
                                className={`text-lg font-bold ${timeRemaining === 0 ? 'text-error' : 'text-foreground'}`}
                              >
                                {formatTime(timeRemaining)}
                              </div>
                              <div className="text-xs text-secondary">
                                Time Remaining
                              </div>
                            </div>
                          )}
                          <div className="text-center">
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status || 'active')}`}
                            >
                              {getStatusIcon(session.status || 'active')}
                              {(session.status || 'active')
                                .charAt(0)
                                .toUpperCase() +
                                (session.status || 'active').slice(1)}
                            </div>
                            <div className="text-xs text-secondary mt-1">
                              Status
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Session Timestamps */}
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-3">
                        Timeline
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-secondary">
                            Started At
                          </label>
                          <p className="text-foreground">
                            {session.started_at
                              ? new Date(session.started_at).toLocaleString()
                              : 'N/A'}
                          </p>
                        </div>
                        {session.completed_at && (
                          <div>
                            <label className="text-sm text-secondary">
                              Completed At
                            </label>
                            <p className="text-foreground">
                              {new Date(session.completed_at).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {session.status === 'active' && (
                      <div className="flex gap-2 pt-4 border-t border-border">
                        <Button
                          onClick={() =>
                            handleSessionAction(session.id, 'pause')
                          }
                          variant="outline"
                          size="sm"
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Pause Session
                        </Button>
                        <Button
                          onClick={() =>
                            handleSessionAction(
                              session.id,
                              'terminate',
                              'Terminated by examiner'
                            )
                          }
                          variant="outline"
                          size="sm"
                          className="text-error hover:text-error"
                        >
                          <StopCircle className="w-4 h-4 mr-1" />
                          Terminate Session
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExamMonitorDashboard
