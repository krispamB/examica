'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import ExamList from '@/components/student/ExamList'
import { Database } from '@/types/database.types'

type Exam = Database['public']['Tables']['exams']['Row']
type ExamSession = Database['public']['Tables']['exam_sessions']['Row']
type ExamResult = Database['public']['Tables']['exam_results']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface ExamWithStatus extends Exam {
  attempts_used: number
  current_session?: ExamSession
  latest_result?: ExamResult
  can_start: boolean
  status_text: string
}

export default function StudentExamsPage() {
  const [exams, setExams] = useState<ExamWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  const supabase = createClient()

  const fetchExamsAndStatus = useCallback(async () => {
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

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('User profile not found')
      }

      setUserProfile(profile)

      // Only students should access this page
      if (profile.role !== 'student') {
        throw new Error('Access denied: Students only')
      }

      // Fetch active exams
      const { data: activeExams, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (examsError) {
        throw new Error('Failed to fetch exams')
      }

      // For each exam, get session and result information
      const examsWithStatus = await Promise.all(
        (activeExams || []).map(async (exam) => {
          // Get all sessions for this exam by this user
          const { data: sessions } = await supabase
            .from('exam_sessions')
            .select('*')
            .eq('exam_id', exam.id)
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })

          // Get results for this exam by this user
          const { data: results } = await supabase
            .from('exam_results')
            .select('*')
            .eq('exam_id', exam.id)
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })

          const attempts_used = sessions?.length || 0
          const max_attempts = 1
          const current_session = sessions?.find(
            (s) => s.status === 'in_progress'
          )
          const latest_result = results?.[0]

          let can_start = true
          let status_text = 'Ready to start'

          if (current_session) {
            can_start = false
            status_text = 'In progress'
          } else if (attempts_used >= max_attempts) {
            can_start = false
            if (latest_result) {
              status_text = `Completed (${latest_result.percentage?.toFixed(1) || 0}%)`
            } else {
              status_text = 'Attempts exhausted'
            }
          } else if (attempts_used > 0) {
            status_text = `Attempt ${attempts_used + 1} of ${max_attempts}`
          }

          return {
            ...exam,
            attempts_used,
            current_session,
            latest_result,
            can_start,
            status_text,
          }
        })
      )

      setExams(examsWithStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exams')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const refreshExams = useCallback(() => {
    void fetchExamsAndStatus()
  }, [fetchExamsAndStatus])

  useEffect(() => {
    void fetchExamsAndStatus()
  }, [fetchExamsAndStatus])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Available Exams
          </h2>
          <p className="mt-2 text-secondary">
            Loading your available examinations...
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
            Available Exams
          </h2>
          <p className="mt-2 text-secondary">
            There was an error loading your exams.
          </p>
        </div>
        <div className="bg-error-light border border-error/20 text-error px-4 py-3 rounded-md">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={refreshExams}
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
        <h2 className="text-2xl font-bold text-foreground">Available Exams</h2>
        <p className="mt-2 text-secondary">
          View and take your assigned examinations. Make sure to read
          instructions carefully before starting.
        </p>
      </div>

      <ExamList
        exams={exams}
        userProfile={userProfile}
        onExamStart={refreshExams}
      />
    </div>
  )
}
