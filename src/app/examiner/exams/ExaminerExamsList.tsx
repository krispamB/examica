'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Eye, Edit3, BarChart3, Users, Clock, FileText, MoreVertical, Trash2, Play, Pause } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { ExamWithQuestions } from '@/lib/exams/service'

interface ExaminerExamsListProps {
  userId: string
  userRole: string
}

const ExaminerExamsList: React.FC<ExaminerExamsListProps> = ({ userId, userRole }) => {
  const [exams, setExams] = useState<ExamWithQuestions[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedExam, setSelectedExam] = useState<string | null>(null)

  const loadExams = useCallback(async () => {
    try {
      setError(null)

      const params = new URLSearchParams()
      if (userRole === 'examiner') {
        params.append('created_by', userId)
      }
      params.append('include_questions', 'true')

      const response = await fetch(`/api/exams?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load exams')
      }

      setExams(data.exams || [])
    } catch (err) {
      console.error('Load exams error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load exams')
    } finally {
      setIsLoading(false)
    }
  }, [userId, userRole])

  useEffect(() => {
    loadExams()
  }, [loadExams])

  const handleStatusChange = async (examId: string, action: 'publish' | 'archive') => {
    try {
      const endpoint = action === 'publish' ? 'publish' : 'archive'
      const response = await fetch(`/api/exams/${examId}/${endpoint}`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} exam`)
      }

      // Refresh exams list
      loadExams()
    } catch (err) {
      console.error(`${action} exam error:`, err)
      setError(err instanceof Error ? err.message : `Failed to ${action} exam`)
    }
  }

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete exam')
      }

      // Refresh exams list
      loadExams()
    } catch (err) {
      console.error('Delete exam error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete exam')
    }
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-error mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Exams</h3>
        <p className="text-secondary mb-6">{error}</p>
        <Button onClick={loadExams}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-secondary">
            {exams.length} {exams.length === 1 ? 'exam' : 'exams'} total
          </div>
        </div>
        
        <Link href="/examiner/create">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Exam
          </Button>
        </Link>
      </div>

      {/* Exams Grid */}
      {exams.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground mb-2">No Exams Yet</h3>
          <p className="text-secondary mb-6">
            Get started by creating your first exam. You can add questions, set time limits, and configure settings.
          </p>
          <Link href="/examiner/create">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Exam
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-background rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
            >
              {/* Exam Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-2">
                    {exam.title}
                  </h3>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                    {exam.status === 'active' && <Play className="w-3 h-3 mr-1" />}
                    {exam.status === 'draft' && <Pause className="w-3 h-3 mr-1" />}
                    {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                  </div>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setSelectedExam(selectedExam === exam.id ? null : exam.id)}
                    className="p-1 hover:bg-background-secondary rounded"
                  >
                    <MoreVertical className="w-4 h-4 text-secondary" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {selectedExam === exam.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-background rounded-lg border border-border shadow-lg z-10">
                      <div className="py-1">
                        <Link
                          href={`/examiner/exams/${exam.id}/edit`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background-secondary"
                          onClick={() => setSelectedExam(null)}
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit Exam
                        </Link>
                        <Link
                          href={`/examiner/exams/${exam.id}/analytics`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background-secondary"
                          onClick={() => setSelectedExam(null)}
                        >
                          <BarChart3 className="w-4 h-4" />
                          View Analytics
                        </Link>
                        
                        {exam.status === 'draft' && (
                          <button
                            onClick={() => {
                              handleStatusChange(exam.id, 'publish')
                              setSelectedExam(null)
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-success hover:bg-background-secondary text-left"
                          >
                            <Play className="w-4 h-4" />
                            Publish Exam
                          </button>
                        )}
                        
                        {exam.status === 'active' && (
                          <button
                            onClick={() => {
                              handleStatusChange(exam.id, 'archive')
                              setSelectedExam(null)
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-warning hover:bg-background-secondary text-left"
                          >
                            <Pause className="w-4 h-4" />
                            Archive Exam
                          </button>
                        )}
                        
                        <div className="border-t border-border my-1" />
                        <button
                          onClick={() => {
                            handleDeleteExam(exam.id)
                            setSelectedExam(null)
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error hover:bg-error-light text-left"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Exam
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Exam Description */}
              {exam.description && (
                <p className="text-sm text-secondary mb-4 line-clamp-2">
                  {exam.description}
                </p>
              )}

              {/* Exam Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center text-primary mb-1">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-medium text-foreground">{exam.question_count || 0}</div>
                  <div className="text-xs text-secondary">Questions</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center text-info mb-1">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {exam.duration ? `${exam.duration}m` : '∞'}
                  </div>
                  <div className="text-xs text-secondary">Duration</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center text-success mb-1">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-medium text-foreground">0</div>
                  <div className="text-xs text-secondary">Attempts</div>
                </div>
              </div>

              {/* Exam Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-xs text-secondary">
                  Updated {formatDate(exam.updated_at)}
                </div>
                
                <div className="flex items-center gap-2">
                  <Link href={`/examiner/exams/${exam.id}/analytics`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/examiner/exams/${exam.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {selectedExam && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setSelectedExam(null)}
        />
      )}
    </div>
  )
}

export default ExaminerExamsList