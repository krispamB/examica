'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Clock,
  Target,
  Eye,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import type { ExamWithQuestions } from '@/lib/exams/service'

interface ExaminerAnalyticsOverviewProps {
  userId: string
  userRole: string
}

interface OverviewStats {
  totalExams: number
  activeExams: number
  totalStudents: number
  totalAttempts: number
  averageScore: number
  recentExams: ExamWithQuestions[]
}

const ExaminerAnalyticsOverview: React.FC<ExaminerAnalyticsOverviewProps> = ({
  userId,
  userRole,
}) => {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOverviewStats = useCallback(async () => {
    try {
      setError(null)

      // Load exams
      const examsParams = new URLSearchParams()
      if (userRole === 'examiner') {
        examsParams.append('created_by', userId)
      }
      examsParams.append('include_questions', 'true')

      const [examsResponse] = await Promise.all([
        fetch(`/api/exams?${examsParams}`),
      ])

      if (!examsResponse.ok) {
        throw new Error('Failed to load analytics data')
      }

      const examsData = await examsResponse.json()
      const exams = examsData.exams || []

      // Calculate stats
      const totalExams = exams.length
      const activeExams = exams.filter(
        (e: { status: string }) => e.status === 'active'
      ).length
      const recentExams = exams.slice(0, 5) // Get 5 most recent

      // TODO: Load actual student and attempt data when available
      const totalStudents = 0
      const totalAttempts = 0
      const averageScore = 0

      setStats({
        totalExams,
        activeExams,
        totalStudents,
        totalAttempts,
        averageScore,
        recentExams,
      })
    } catch (err) {
      console.error('Load overview stats error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }, [userId, userRole])

  useEffect(() => {
    loadOverviewStats()
  }, [userId, loadOverviewStats])

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'text-success bg-success-light'
      case 'draft':
        return 'text-warning bg-warning-light'
      case 'archived':
        return 'text-secondary bg-background-secondary'
      default:
        return 'text-secondary bg-background-secondary'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-error mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Analytics Error
        </h3>
        <p className="text-secondary mb-6">
          {error || 'Failed to load analytics'}
        </p>
        <Button onClick={loadOverviewStats}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-secondary">
              Total Exams
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalExams}
          </div>
          <div className="text-xs text-secondary">
            {stats.activeExams} active
          </div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-info" />
            <span className="text-sm font-medium text-secondary">Students</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalStudents}
          </div>
          <div className="text-xs text-secondary">Enrolled</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-warning" />
            <span className="text-sm font-medium text-secondary">Attempts</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalAttempts}
          </div>
          <div className="text-xs text-secondary">Total attempts</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-secondary">
              Avg Score
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.averageScore > 0 ? `${stats.averageScore.toFixed(1)}%` : '-'}
          </div>
          <div className="text-xs text-secondary">Overall average</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-error" />
            <span className="text-sm font-medium text-secondary">
              Pass Rate
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">-</div>
          <div className="text-xs text-secondary">≥60% threshold</div>
        </div>
      </div>

      {/* Recent Exams */}
      <div className="bg-background rounded-lg border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">Recent Exams</h3>
          <Link href="/examiner/exams">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>

        {stats.recentExams.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Exams Yet
            </h3>
            <p className="text-secondary mb-6">
              Create your first exam to get started with analytics
            </p>
            <Link href="/examiner/create">
              <Button>Create Exam</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {stats.recentExams.map((exam) => (
              <div
                key={exam.id}
                className="px-6 py-4 hover:bg-background-secondary"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-base font-medium text-foreground">
                        {exam.title}
                      </h4>
                      <div
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status || 'draft')}`}
                      >
                        {(exam.status || 'draft').charAt(0).toUpperCase() +
                          (exam.status || 'draft').slice(1)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-secondary">
                      <span>{exam.question_count || 0} questions</span>
                      <span>
                        {exam.duration
                          ? `${exam.duration} min`
                          : 'Unlimited time'}
                      </span>
                      <span>
                        Updated{' '}
                        {exam.updated_at
                          ? formatDate(exam.updated_at)
                          : 'Never'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <div className="text-sm font-medium text-foreground">
                        0 attempts
                      </div>
                      <div className="text-xs text-secondary">- avg score</div>
                    </div>

                    <Link href={`/examiner/exams/${exam.id}/analytics`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      {stats.totalExams > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background rounded-lg border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Performance Summary
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-secondary">Exam Creation Rate</span>
                <span className="text-foreground font-medium">
                  {((stats.totalExams / 30) * 7).toFixed(1)} per week
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-secondary">Active vs Draft</span>
                <span className="text-foreground font-medium">
                  {stats.totalExams > 0
                    ? Math.round((stats.activeExams / stats.totalExams) * 100)
                    : 0}
                  % active
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-secondary">Average Questions</span>
                <span className="text-foreground font-medium">
                  {stats.totalExams > 0
                    ? Math.round(
                        stats.recentExams.reduce(
                          (sum, exam) => sum + (exam.question_count || 0),
                          0
                        ) / Math.min(stats.recentExams.length, 5)
                      )
                    : 0}{' '}
                  per exam
                </span>
              </div>
            </div>
          </div>

          <div className="bg-background rounded-lg border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Quick Actions
            </h3>

            <div className="space-y-3">
              <Link href="/examiner/create" className="block">
                <div className="p-3 border border-border rounded-lg hover:bg-background-secondary transition-colors">
                  <div className="text-sm font-medium text-foreground">
                    Create New Exam
                  </div>
                  <div className="text-xs text-secondary">
                    Start building a new examination
                  </div>
                </div>
              </Link>

              <Link href="/examiner/exams" className="block">
                <div className="p-3 border border-border rounded-lg hover:bg-background-secondary transition-colors">
                  <div className="text-sm font-medium text-foreground">
                    Manage Exams
                  </div>
                  <div className="text-xs text-secondary">
                    View and edit your existing exams
                  </div>
                </div>
              </Link>

              <Link href="/admin/monitor" className="block">
                <div className="p-3 border border-border rounded-lg hover:bg-background-secondary transition-colors">
                  <div className="text-sm font-medium text-foreground">
                    Monitor Live Sessions
                  </div>
                  <div className="text-xs text-secondary">
                    View active exam sessions
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExaminerAnalyticsOverview
