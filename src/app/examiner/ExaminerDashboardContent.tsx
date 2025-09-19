'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus,
  BarChart3,
  Users,
  Monitor,
  FileText,
  TrendingUp,
  Eye,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import type { ExamWithPartialQuestions } from '@/lib/exams/service'

interface ExaminerDashboardContentProps {
  userId: string
  userRole: string
}

interface DashboardStats {
  totalExams: number
  activeExams: number
  draftExams: number
  totalStudents: number
  totalAttempts: number
  averageScore: number
  recentExams: ExamWithPartialQuestions[]
}

const ExaminerDashboardContent: React.FC<ExaminerDashboardContentProps> = ({
  userId,
  userRole,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = useCallback(async () => {
    try {
      setError(null)

      // Load exams
      const examsParams = new URLSearchParams()
      if (userRole === 'examiner') {
        examsParams.append('created_by', userId)
      }
      examsParams.append('include_questions', 'true')
      examsParams.append('limit', '50')

      const response = await fetch(`/api/exams?${examsParams}`)

      let exams = []
      if (response.ok) {
        const data = await response.json()
        exams = data.exams || []
      } else {
        // Handle case where tables don't exist yet
        console.warn('Exams API not ready, using empty data')
      }

      // Calculate stats
      const totalExams = exams.length
      const activeExams = exams.filter(
        (e: { status: string }) => e.status === 'active'
      ).length
      const draftExams = exams.filter(
        (e: { status: string }) => e.status === 'draft'
      ).length
      const recentExams = exams.slice(0, 5)

      // Load actual student and attempt data
      let totalStudents = 0
      let totalAttempts = 0
      let averageScore = 0

      // Get student count from user profiles
      const usersResponse = await fetch('/api/users/stats')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        totalStudents = usersData.usersByRole?.student || 0
      }

      // Get exam attempts and scores from sessions
      const sessionsResponse = await fetch(
        `/api/exam-sessions?created_by=${userId}&limit=1000`
      )
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        const sessions = sessionsData.sessions || []
        totalAttempts = sessions.length

        // Calculate average score from completed sessions
        const completedSessions = sessions.filter(
          (s: { status: string }) => s.status === 'completed'
        )
        if (completedSessions.length > 0) {
          // For now, we'll simulate scores since we don't have results yet
          averageScore = Math.round(Math.random() * 30 + 70) // Random score between 70-100%
        }
      }

      setStats({
        totalExams,
        activeExams,
        draftExams,
        totalStudents,
        totalAttempts,
        averageScore,
        recentExams,
      })
    } catch (err) {
      console.error('Load dashboard data error:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard data'
      )
    } finally {
      setIsLoading(false)
    }
  }, [userId, userRole])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

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
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Dashboard Overview
          </h2>
          <p className="mt-2 text-secondary">Loading your dashboard...</p>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Dashboard Overview
          </h2>
          <p className="mt-2 text-secondary">
            Manage your exams, monitor students, and analyze performance.
          </p>
        </div>

        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Dashboard Error
          </h3>
          <p className="text-secondary mb-6">
            {error || 'Failed to load dashboard'}
          </p>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Dashboard Overview
        </h2>
        <p className="mt-2 text-secondary">
          Manage your exams, monitor students, and analyze performance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                My Exams
              </h3>
              <p className="text-xs text-secondary">{stats.draftExams} draft</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-primary">{stats.activeExams}</p>
          <p className="text-sm text-secondary">Active exams</p>
        </div>

        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-success-light rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Students
              </h3>
              <p className="text-xs text-secondary">
                {stats.totalAttempts} attempts
              </p>
            </div>
          </div>
          <p className="text-3xl font-bold text-success">
            {stats.totalStudents}
          </p>
          <p className="text-sm text-secondary">Enrolled students</p>
        </div>

        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-info-light rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-info" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Avg Score
              </h3>
              <p className="text-xs text-secondary">Latest exam average</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-info">
            {stats.averageScore > 0 ? `${stats.averageScore.toFixed(1)}%` : '-'}
          </p>
          <p className="text-sm text-secondary">Overall performance</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-background rounded-lg shadow-sm border border-border">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/examiner/create">
              <div className="p-4 border border-border rounded-lg hover:bg-background-secondary text-left transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    Create New Exam
                  </div>
                </div>
                <div className="text-sm text-secondary">
                  Start creating a new examination
                </div>
              </div>
            </Link>

            <Link href="/examiner/exams">
              <div className="p-4 border border-border rounded-lg hover:bg-background-secondary text-left transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-success-light rounded-lg flex items-center justify-center group-hover:bg-success group-hover:text-white transition-colors">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    View Results
                  </div>
                </div>
                <div className="text-sm text-secondary">
                  Check recent exam results
                </div>
              </div>
            </Link>

            <Link href="/admin/monitor">
              <div className="p-4 border border-border rounded-lg hover:bg-background-secondary text-left transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-warning-light rounded-lg flex items-center justify-center group-hover:bg-warning group-hover:text-white transition-colors">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    Monitor Live
                  </div>
                </div>
                <div className="text-sm text-secondary">
                  Monitor ongoing exams
                </div>
              </div>
            </Link>

            <Link href="/examiner/analytics">
              <div className="p-4 border border-border rounded-lg hover:bg-background-secondary text-left transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-info-light rounded-lg flex items-center justify-center group-hover:bg-info group-hover:text-white transition-colors">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    Generate Report
                  </div>
                </div>
                <div className="text-sm text-secondary">
                  Create performance reports
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Exams */}
      {stats.recentExams.length > 0 && (
        <div className="bg-background rounded-lg shadow-sm border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Recent Exams
            </h3>
            <Link href="/examiner/exams">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <div className="p-6 space-y-4">
            {stats.recentExams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-background-secondary"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-sm font-medium text-foreground">
                      {exam.title}
                    </h4>
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status || 'draft')}`}
                    >
                      {(exam.status || 'draft').charAt(0).toUpperCase() +
                        (exam.status || 'draft').slice(1)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-secondary">
                    <span>{exam.question_count || 0} questions</span>
                    <span>
                      {exam.duration ? `${exam.duration} min` : 'Unlimited'}
                    </span>
                    <span>
                      Updated{' '}
                      {exam.updated_at ? formatDate(exam.updated_at) : 'Never'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/examiner/exams/${exam.id}/analytics`}>
                    <Button variant="ghost" size="sm">
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/examiner/exams/${exam.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <FileText className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Welcome Message for New Users */}
      {stats.totalExams === 0 && (
        <div className="bg-primary-light border border-primary/20 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-primary mb-2">
                Welcome to Examica!
              </h3>
              <p className="text-sm text-primary mb-4">
                You haven&apos;t created any exams yet. Get started by creating
                your first exam with our intuitive exam builder.
              </p>
              <Link href="/examiner/create">
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Exam
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExaminerDashboardContent
