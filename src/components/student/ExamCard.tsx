'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Database } from '@/types/database.types'
import StartExamModal from './StartExamModal'
import { formatDuration, formatDateTime } from '@/lib/utils'

type Exam = Database['public']['Tables']['exams']['Row']
type ExamSession = Database['public']['Tables']['exam_sessions']['Row']
type ExamResult = Database['public']['Tables']['exam_results']['Row']

interface ExamWithStatus extends Exam {
  attempts_used: number
  current_session?: ExamSession
  latest_result?: ExamResult
  can_start: boolean
  status_text: string
}

interface ExamCardProps {
  exam: ExamWithStatus
  userProfile: Database['public']['Tables']['user_profiles']['Row'] | null
  onExamStart: () => void
}

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  userProfile,
  onExamStart,
}) => {
  const [showStartModal, setShowStartModal] = useState(false)

  const handleStartExam = () => {
    setShowStartModal(true)
  }

  const handleContinueExam = () => {
    if (exam.current_session) {
      window.location.href = `/student/exams/${exam.id}`
    }
  }

  const handleViewResult = () => {
    if (exam.latest_result) {
      window.location.href = `/student/results/${exam.latest_result.id}`
    }
  }

  const getStatusBadgeColor = () => {
    if (exam.current_session) return 'bg-info text-info-dark border-info/20'
    if (exam.latest_result)
      return 'bg-success text-success-dark border-success/20'
    if (exam.can_start) return 'bg-primary text-primary-dark border-primary/20'
    return 'bg-gray-100 text-gray-700 border-gray/20'
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-foreground">
                {exam.title}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded border ${getStatusBadgeColor()}`}
              >
                {exam.status_text}
              </span>
            </div>

            {exam.category && (
              <p className="text-sm text-secondary mb-1">
                Category: {exam.category}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {exam.description && (
          <p className="text-secondary mb-4 line-clamp-2">{exam.description}</p>
        )}

        {/* Exam Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-md">
          {exam.duration && (
            <div className="text-center">
              <p className="text-xs text-secondary mb-1">Duration</p>
              <p className="text-sm font-medium text-foreground">
                {formatDuration(exam.duration)}
              </p>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-secondary mb-1">Attempts</p>
            <p className="text-sm font-medium text-foreground">
              {exam.attempts_used} / {exam.max_attempts || 1}
            </p>
          </div>

          {exam.pass_threshold && (
            <div className="text-center">
              <p className="text-xs text-secondary mb-1">Pass Score</p>
              <p className="text-sm font-medium text-foreground">
                {exam.pass_threshold}%
              </p>
            </div>
          )}

          {exam.requires_verification && (
            <div className="text-center">
              <p className="text-xs text-secondary mb-1">Verification</p>
              <p className="text-sm font-medium text-warning">Required</p>
            </div>
          )}
        </div>

        {/* Latest Result */}
        {exam.latest_result && (
          <div className="mb-4 p-3 bg-success-light border border-success/20 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-success-dark">
                Latest Score
              </span>
              <span className="text-lg font-bold text-success">
                {exam.latest_result.percentage?.toFixed(1) || 0}%
              </span>
            </div>
            {exam.latest_result.completed_at && (
              <p className="text-xs text-success mt-1">
                Completed: {formatDateTime(exam.latest_result.completed_at)}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {exam.current_session && (
            <Button
              onClick={handleContinueExam}
              className="flex-1"
              variant="primary"
            >
              Continue Exam
            </Button>
          )}

          {exam.can_start && !exam.current_session && (
            <Button
              onClick={handleStartExam}
              className="flex-1"
              variant="primary"
            >
              {exam.attempts_used > 0 ? 'Retake Exam' : 'Start Exam'}
            </Button>
          )}

          {exam.latest_result && (
            <Button
              onClick={handleViewResult}
              variant="outline"
              className="flex-1"
            >
              View Result
            </Button>
          )}

          {!exam.can_start && !exam.current_session && !exam.latest_result && (
            <Button disabled variant="outline" className="flex-1">
              No Attempts Left
            </Button>
          )}
        </div>

        {/* Instructions Preview */}
        {exam.instructions && (
          <div className="mt-4 pt-4 border-t border-border">
            <details className="text-sm">
              <summary className="cursor-pointer text-secondary hover:text-foreground font-medium mb-2">
                View Instructions
              </summary>
              <div className="text-secondary whitespace-pre-wrap pl-2">
                {exam.instructions}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Start Exam Modal */}
      <StartExamModal
        exam={exam}
        userProfile={userProfile}
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        onSuccess={() => {
          setShowStartModal(false)
          onExamStart()
        }}
      />
    </>
  )
}

export default ExamCard
