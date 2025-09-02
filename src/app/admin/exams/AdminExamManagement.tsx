'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Users, FileText, BarChart3, Clock, Edit3, Trash2, Play, Pause, UserCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { ExamWithQuestions } from '@/lib/exams/service'

interface AdminExamManagementProps {
  userId: string
}

interface ExamStats {
  totalExams: number
  activeExams: number
  draftExams: number
  archivedExams: number
  totalAttempts: number
  totalStudents: number
}

const AdminExamManagement: React.FC<AdminExamManagementProps> = () => {
  const [exams, setExams] = useState<ExamWithQuestions[]>([])
  const [stats, setStats] = useState<ExamStats>({
    totalExams: 0,
    activeExams: 0,
    draftExams: 0,
    archivedExams: 0,
    totalAttempts: 0,
    totalStudents: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedExam, setSelectedExam] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all')

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    try {
      setError(null)

      const params = new URLSearchParams()
      params.append('include_questions', 'true')
      params.append('limit', '100')

      const response = await fetch(`/api/exams?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load exams')
      }

      const examsData = data.exams || []
      setExams(examsData)

      // Calculate stats
      const newStats = {
        totalExams: examsData.length,
        activeExams: examsData.filter((e: { status: string }) => e.status === 'active').length,
        draftExams: examsData.filter((e: { status: string }) => e.status === 'draft').length,
        archivedExams: examsData.filter((e: { status: string }) => e.status === 'archived').length,
        totalAttempts: 0, // TODO: Load from exam results
        totalStudents: 0, // TODO: Load from user profiles
      }
      setStats(newStats)
    } catch (err) {
      console.error('Load exams error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load exams')
    } finally {
      setIsLoading(false)
    }
  }

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

  const filteredExams = exams.filter(exam => {
    if (filter === 'all') return true
    return exam.status === filter
  })

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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-secondary">Total</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.totalExams}</div>
          <div className="text-xs text-secondary">All exams</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-secondary">Active</span>
          </div>
          <div className="text-2xl font-bold text-success">{stats.activeExams}</div>
          <div className="text-xs text-secondary">Published</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Pause className="w-5 h-5 text-warning" />
            <span className="text-sm font-medium text-secondary">Draft</span>
          </div>
          <div className="text-2xl font-bold text-warning">{stats.draftExams}</div>
          <div className="text-xs text-secondary">Unpublished</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-secondary" />
            <span className="text-sm font-medium text-secondary">Archived</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.archivedExams}</div>
          <div className="text-xs text-secondary">Inactive</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-info" />
            <span className="text-sm font-medium text-secondary">Students</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.totalStudents}</div>
          <div className="text-xs text-secondary">Enrolled</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-error" />
            <span className="text-sm font-medium text-secondary">Attempts</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.totalAttempts}</div>
          <div className="text-xs text-secondary">Total</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'draft' | 'archived')}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="all">All Exams ({stats.totalExams})</option>
            <option value="active">Active ({stats.activeExams})</option>
            <option value="draft">Draft ({stats.draftExams})</option>
            <option value="archived">Archived ({stats.archivedExams})</option>
          </select>
          
          <div className="text-sm text-secondary">
            {filteredExams.length} {filteredExams.length === 1 ? 'exam' : 'exams'} shown
          </div>
        </div>
        
        <Link href="/admin/exams/create">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Exam
          </Button>
        </Link>
      </div>

      {/* Exams Table */}
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">Exams</h3>
        </div>

        {filteredExams.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">
              {filter === 'all' ? 'No Exams Yet' : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Exams`}
            </h3>
            <p className="text-secondary mb-6">
              {filter === 'all' 
                ? 'Get started by creating your first exam'
                : `No exams with ${filter} status found`}
            </p>
            {filter === 'all' && (
              <Link href="/admin/exams/create">
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Exam
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">Exam</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">Creator</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">Questions</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">Duration</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">Attempts</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">Updated</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-background-secondary">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-foreground line-clamp-1">
                          {exam.title}
                        </div>
                        {exam.description && (
                          <div className="text-xs text-secondary line-clamp-1 mt-1">
                            {exam.description}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary-light text-primary rounded-full flex items-center justify-center text-xs font-medium">
                          <UserCheck className="w-3 h-3" />
                        </div>
                        <div className="text-sm text-foreground">Examiner</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                        {exam.status === 'active' && <Play className="w-3 h-3 mr-1" />}
                        {exam.status === 'draft' && <Pause className="w-3 h-3 mr-1" />}
                        {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">{exam.question_count || 0}</div>
                      <div className="text-xs text-secondary">questions</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">
                        {exam.duration ? `${exam.duration}m` : '∞'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">0</div>
                      <div className="text-xs text-secondary">attempts</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">
                        {formatDate(exam.updated_at)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/exams/${exam.id}/analytics`}>
                          <Button variant="ghost" size="sm">
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                        </Link>
                        
                        <Link href={`/admin/exams/${exam.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </Link>
                        
                        <div className="relative">
                          <Button
                            onClick={() => setSelectedExam(selectedExam === exam.id ? null : exam.id)}
                            variant="ghost"
                            size="sm"
                          >
                            •••
                          </Button>
                          
                          {selectedExam === exam.id && (
                            <div className="absolute right-0 mt-1 w-40 bg-background rounded-lg border border-border shadow-lg z-10">
                              <div className="py-1">
                                {exam.status === 'draft' && (
                                  <button
                                    onClick={() => {
                                      handleStatusChange(exam.id, 'publish')
                                      setSelectedExam(null)
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-success hover:bg-background-secondary text-left"
                                  >
                                    <Play className="w-4 h-4" />
                                    Publish
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
                                    Archive
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
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

export default AdminExamManagement