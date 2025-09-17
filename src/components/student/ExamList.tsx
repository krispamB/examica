'use client'

import ExamCard from './ExamCard'
import { Database } from '@/types/database.types'

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

interface ExamListProps {
  exams: ExamWithStatus[]
  userProfile: Database['public']['Tables']['user_profiles']['Row'] | null
  onExamStart: () => void
}

const ExamList: React.FC<ExamListProps> = ({
  exams,
  userProfile,
  onExamStart,
}) => {
  if (exams.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-border">
        <div className="p-8 text-center">
          <div className="text-secondary mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Exams Available
          </h3>
          <p className="text-secondary max-w-md mx-auto">
            There are currently no active examinations assigned to you. Check
            back later or contact your instructor.
          </p>
        </div>
      </div>
    )
  }

  // Separate exams by status for better organization
  const activeSessionExams = exams.filter((exam) => exam.current_session)
  const availableExams = exams.filter(
    (exam) => exam.can_start && !exam.current_session
  )
  const completedExams = exams.filter(
    (exam) => exam.latest_result && !exam.current_session && !exam.can_start
  )
  const unavailableExams = exams.filter(
    (exam) => !exam.can_start && !exam.current_session && !exam.latest_result
  )

  return (
    <div className="space-y-6">
      {/* Active Sessions */}
      {activeSessionExams.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-info rounded-full animate-pulse"></div>
            In Progress
            <span className="text-sm text-secondary font-normal">
              ({activeSessionExams.length})
            </span>
          </h3>
          <div className="grid gap-4">
            {activeSessionExams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                userProfile={userProfile}
                onExamStart={onExamStart}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Exams */}
      {availableExams.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Available
            <span className="text-sm text-secondary font-normal">
              ({availableExams.length})
            </span>
          </h3>
          <div className="grid gap-4">
            {availableExams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                userProfile={userProfile}
                onExamStart={onExamStart}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Exams */}
      {completedExams.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            Completed
            <span className="text-sm text-secondary font-normal">
              ({completedExams.length})
            </span>
          </h3>
          <div className="grid gap-4">
            {completedExams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                userProfile={userProfile}
                onExamStart={onExamStart}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unavailable Exams */}
      {unavailableExams.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            Unavailable
            <span className="text-sm text-secondary font-normal">
              ({unavailableExams.length})
            </span>
          </h3>
          <div className="grid gap-4">
            {unavailableExams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                userProfile={userProfile}
                onExamStart={onExamStart}
              />
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-secondary">
            Total Exams:{' '}
            <strong className="text-foreground">{exams.length}</strong>
          </span>
          <div className="flex gap-4">
            {activeSessionExams.length > 0 && (
              <span className="text-info">
                In Progress: <strong>{activeSessionExams.length}</strong>
              </span>
            )}
            {availableExams.length > 0 && (
              <span className="text-primary">
                Available: <strong>{availableExams.length}</strong>
              </span>
            )}
            {completedExams.length > 0 && (
              <span className="text-success">
                Completed: <strong>{completedExams.length}</strong>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExamList
