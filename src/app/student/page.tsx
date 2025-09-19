'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface DashboardStats {
  availableExams: number
  completedExams: number
  averageScore: number | null
  recentActivity: Array<{
    type: 'exam_started' | 'exam_completed'
    examTitle: string
    date: string
    score?: number
  }>
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    availableExams: 0,
    completedExams: 0,
    averageScore: null,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Get user profile to verify student role
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile || profile.role !== 'student') {
        throw new Error('Access denied: Students only')
      }

      // Fetch available exams count
      const { count: availableCount, error: availableError } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      if (availableError) {
        throw new Error('Failed to fetch available exams')
      }

      // Fetch completed exams and calculate stats
      const { data: results, error: resultsError } = await supabase
        .from('exam_results')
        .select('*, exams(title)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      if (resultsError) {
        throw new Error('Failed to fetch exam results')
      }

      // Calculate average score
      const completedCount = results?.length || 0
      const averageScore =
        completedCount > 0
          ? results.reduce(
              (sum, result) => sum + (result.percentage_score || 0),
              0
            ) / completedCount
          : null

      // Fetch recent activity (sessions and results)
      const { data: recentSessions, error: sessionsError } = await supabase
        .from('exam_sessions')
        .select('*, exams(title)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (sessionsError) {
        console.warn('Failed to fetch recent sessions:', sessionsError)
      }

      // Build recent activity array
      const recentActivity: DashboardStats['recentActivity'] = []

      // Add recent results
      results?.slice(0, 3).forEach((result) => {
        recentActivity.push({
          type: 'exam_completed',
          examTitle:
            (result.exams as { title: string })?.title || 'Unknown Exam',
          date: new Date(
            result.completed_at || result.created_at || new Date()
          ).toLocaleDateString(),
          score: result.percentage_score || undefined,
        })
      })

      // Add recent sessions (started exams)
      recentSessions?.slice(0, 2).forEach((session) => {
        if (session.status === 'active' || session.status === 'paused') {
          recentActivity.push({
            type: 'exam_started',
            examTitle:
              (session.exams as { title: string })?.title || 'Unknown Exam',
            date: new Date(
              session.started_at || session.created_at || new Date()
            ).toLocaleDateString(),
          })
        }
      })

      // Sort by date and limit to 5 most recent
      recentActivity.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      setStats({
        availableExams: availableCount || 0,
        completedExams: completedCount,
        averageScore,
        recentActivity: recentActivity.slice(0, 5),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void fetchDashboardStats()
  }, [fetchDashboardStats])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Dashboard Overview
          </h2>
          <p className="mt-2 text-secondary">
            Loading your examination dashboard...
          </p>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Dashboard Overview
          </h2>
          <p className="mt-2 text-secondary">
            Welcome to your examination portal.
          </p>
        </div>
        <div className="bg-error-light border border-error/20 text-error px-4 py-3 rounded-md">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => void fetchDashboardStats()}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
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
          Welcome to your examination portal. View available exams and track
          your progress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Available Exams
          </h3>
          <p className="mt-2 text-3xl font-bold text-primary">
            {stats.availableExams}
          </p>
          <p className="mt-1 text-sm text-secondary">Ready to take</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground">Completed</h3>
          <p className="mt-2 text-3xl font-bold text-success">
            {stats.completedExams}
          </p>
          <p className="mt-1 text-sm text-secondary">Exams completed</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Average Score
          </h3>
          <p className="mt-2 text-3xl font-bold text-info">
            {stats.averageScore !== null
              ? `${stats.averageScore.toFixed(1)}%`
              : '-'}
          </p>
          <p className="mt-1 text-sm text-secondary">Your performance</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Available Exams
          </h3>
          {stats.availableExams > 0 ? (
            <div className="text-center py-4">
              <p className="text-foreground mb-2">
                You have {stats.availableExams} exam
                {stats.availableExams !== 1 ? 's' : ''} available
              </p>
              <Link
                href="/student/exams"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                View All Exams
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-secondary mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-secondary">No exams available at this time</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Recent Activity
          </h3>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === 'exam_completed'
                          ? 'bg-success'
                          : 'bg-primary'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {activity.type === 'exam_completed'
                          ? 'Completed'
                          : 'Started'}
                        : {activity.examTitle}
                      </p>
                      <p className="text-xs text-secondary">{activity.date}</p>
                    </div>
                  </div>
                  {activity.score !== undefined && (
                    <div className="text-sm font-medium text-success">
                      {activity.score.toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-secondary mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-secondary">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
