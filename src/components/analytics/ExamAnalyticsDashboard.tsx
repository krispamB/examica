'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp,
  Users,
  Clock,
  Target,
  BarChart3,
  PieChart,
  RefreshCw,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import type { ExamAnalytics } from '@/lib/results/service'

interface ExamAnalyticsDashboardProps {
  examId: string
  examTitle?: string
  className?: string
}

const ExamAnalyticsDashboard: React.FC<ExamAnalyticsDashboardProps> = ({
  examId,
  examTitle,
  className = '',
}) => {
  const [analytics, setAnalytics] = useState<ExamAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadAnalytics = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) setIsRefreshing(true)
        setError(null)

        const response = await fetch(`/api/exams/${examId}/analytics`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load analytics')
        }

        setAnalytics(data.analytics)
      } catch (err) {
        console.error('Load analytics error:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to load analytics'
        )
      } finally {
        setIsLoading(false)
        if (showRefresh) setIsRefreshing(false)
      }
    },
    [examId]
  )

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`
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

  if (error || !analytics) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="w-12 h-12 text-error mx-auto mb-4">
            <BarChart3 className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Analytics Error
          </h3>
          <p className="text-secondary mb-6">
            {error || 'Failed to load analytics'}
          </p>
          <Button onClick={() => loadAnalytics()}>Try Again</Button>
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
            Exam Analytics
          </h2>
          <p className="text-secondary">
            {examTitle
              ? `Analysis for "${examTitle}"`
              : 'Detailed performance analysis'}
          </p>
        </div>

        <Button
          onClick={() => loadAnalytics(true)}
          disabled={isRefreshing}
          variant="ghost"
          size="sm"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-secondary">
              Total Attempts
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {analytics.totalAttempts}
          </div>
          <div className="text-xs text-secondary">
            {analytics.completedAttempts} completed
          </div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-secondary">
              Average Score
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatPercentage(analytics.averageScore)}
          </div>
          <div className="text-xs text-secondary">
            Pass rate: {formatPercentage(analytics.passRate)}
          </div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-info" />
            <span className="text-sm font-medium text-secondary">Avg Time</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatTime(analytics.averageTimeSpent)}
          </div>
          <div className="text-xs text-secondary">Completion time</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-warning" />
            <span className="text-sm font-medium text-secondary">
              Pass Rate
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatPercentage(analytics.passRate)}
          </div>
          <div className="text-xs text-secondary">≥60% threshold</div>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="bg-background rounded-lg border border-border p-6">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Score Distribution
        </h3>

        <div className="space-y-4">
          {analytics.scoreDistribution.map((range, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">
                  {range.range}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-secondary">{range.count} students</span>
                  <span className="text-foreground font-medium">
                    {formatPercentage(range.percentage)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-background-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${range.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-background rounded-lg border border-border p-6">
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time Analysis
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-secondary">Average Time</span>
              <span className="text-foreground font-medium">
                {formatTime(analytics.timeAnalytics.averageCompletionTime)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-secondary">Fastest Completion</span>
              <span className="text-foreground font-medium">
                {formatTime(analytics.timeAnalytics.fastestCompletion)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-secondary">Slowest Completion</span>
              <span className="text-foreground font-medium">
                {formatTime(analytics.timeAnalytics.slowestCompletion)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-lg border border-border p-6">
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Summary
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Completion Rate</span>
                <span className="text-sm font-medium text-foreground">
                  {formatPercentage(
                    (analytics.completedAttempts / analytics.totalAttempts) *
                      100
                  )}
                </span>
              </div>
              <div className="w-full bg-background-secondary rounded-full h-2">
                <div
                  className="bg-info h-2 rounded-full"
                  style={{
                    width: `${(analytics.completedAttempts / analytics.totalAttempts) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Pass Rate</span>
                <span className="text-sm font-medium text-foreground">
                  {formatPercentage(analytics.passRate)}
                </span>
              </div>
              <div className="w-full bg-background-secondary rounded-full h-2">
                <div
                  className="bg-success h-2 rounded-full"
                  style={{ width: `${analytics.passRate}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="text-sm text-secondary mb-1">
                Overall Performance
              </div>
              <div className="text-lg font-semibold text-foreground">
                {analytics.averageScore >= 80
                  ? 'Excellent'
                  : analytics.averageScore >= 70
                    ? 'Good'
                    : analytics.averageScore >= 60
                      ? 'Satisfactory'
                      : 'Needs Improvement'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Analytics would go here if we had detailed question data */}
      {analytics.questionAnalytics &&
        analytics.questionAnalytics.length > 0 && (
          <div className="bg-background rounded-lg border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Question Analysis
            </h3>
            <p className="text-secondary text-sm">
              Detailed question-by-question analysis would be displayed here.
            </p>
          </div>
        )}

      {/* Empty State */}
      {analytics.totalAttempts === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Data Available
          </h3>
          <p className="text-secondary">
            No exam attempts have been completed yet. Analytics will appear once
            students start taking the exam.
          </p>
        </div>
      )}
    </div>
  )
}

export default ExamAnalyticsDashboard
