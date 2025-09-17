'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Trophy,
  Clock,
  FileText,
  TrendingUp,
  Users,
  Search,
  Filter,
  Eye,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import ExamResultsHistory from '@/components/student/ExamResultsHistory'
import type { ExamResultWithDetails } from '@/lib/results/service'

interface ExaminerResultsViewProps {
  userId: string
  userRole: string
}

interface ResultsFilters {
  examId?: string
  minScore?: number
  maxScore?: number
  completedAfter?: string
  completedBefore?: string
  search?: string
}

const ExaminerResultsView: React.FC<ExaminerResultsViewProps> = ({
  userId: _userId,
  userRole: _userRole,
}) => {
  const [results, setResults] = useState<ExamResultWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] =
    useState<ExamResultWithDetails | null>(null)
  const [filters, setFilters] = useState<ResultsFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const loadResults = useCallback(async () => {
    try {
      setError(null)

      const params = new URLSearchParams()
      params.append('include_details', 'true')
      params.append('limit', '100')

      if (filters.examId) params.append('exam_id', filters.examId)
      if (filters.minScore !== undefined)
        params.append('min_score', filters.minScore.toString())
      if (filters.maxScore !== undefined)
        params.append('max_score', filters.maxScore.toString())
      if (filters.completedAfter)
        params.append('completed_after', filters.completedAfter)
      if (filters.completedBefore)
        params.append('completed_before', filters.completedBefore)

      const response = await fetch(`/api/exam-results?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load results')
      }

      setResults(data.results || [])
    } catch (err) {
      console.error('Load results error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load results')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadResults()
  }, [loadResults])

  const filteredResults = results.filter((result) => {
    if (!searchTerm) return true

    const examTitle = result.exams?.title?.toLowerCase() || ''
    const studentName =
      `${result.exam_sessions?.user_profiles?.first_name || ''} ${result.exam_sessions?.user_profiles?.last_name || ''}`.toLowerCase()
    const studentEmail =
      result.exam_sessions?.user_profiles?.email?.toLowerCase() || ''

    return (
      examTitle.includes(searchTerm.toLowerCase()) ||
      studentName.includes(searchTerm.toLowerCase()) ||
      studentEmail.includes(searchTerm.toLowerCase())
    )
  })

  const calculateStats = () => {
    if (filteredResults.length === 0) {
      return {
        totalResults: 0,
        averageScore: 0,
        passRate: 0,
        totalTimeSpent: 0,
        uniqueStudents: 0,
        uniqueExams: 0,
      }
    }

    const totalScore = filteredResults.reduce(
      (sum, r) => sum + (r.percentage_score || 0),
      0
    )
    const averageScore = totalScore / filteredResults.length
    const passedResults = filteredResults.filter(
      (r) => (r.percentage_score || 0) >= 60
    ).length
    const passRate = (passedResults / filteredResults.length) * 100
    const totalTimeSpent = filteredResults.reduce(
      (sum, r) => sum + (r.time_spent || 0),
      0
    )
    const uniqueStudents = new Set(filteredResults.map((r) => r.user_id)).size
    const uniqueExams = new Set(filteredResults.map((r) => r.exam_id)).size

    return {
      totalResults: filteredResults.length,
      averageScore,
      passRate,
      totalTimeSpent,
      uniqueStudents,
      uniqueExams,
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-success'
    if (score >= 80) return 'text-info'
    if (score >= 70) return 'text-warning'
    if (score >= 60) return 'text-primary'
    return 'text-error'
  }

  const stats = calculateStats()

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
        <h3 className="text-lg font-medium text-foreground mb-2">
          Error Loading Results
        </h3>
        <p className="text-secondary mb-6">{error}</p>
        <Button onClick={loadResults}>Try Again</Button>
      </div>
    )
  }

  // Show specific result details
  if (selectedResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setSelectedResult(null)}
            variant="ghost"
            size="sm"
          >
            ← Back to Results
          </Button>

          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {selectedResult.exam_sessions?.user_profiles?.first_name}{' '}
              {selectedResult.exam_sessions?.user_profiles?.last_name}
            </h2>
            <p className="text-secondary">{selectedResult.exams?.title}</p>
          </div>
        </div>

        <ExamResultsHistory userId={selectedResult.user_id || ''} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exam Results</h1>
        <p className="text-secondary">
          View all exam results and student performance across your exams
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
          <input
            type="text"
            placeholder="Search by exam name, student name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="ghost"
          size="sm"
        >
          <Filter className="w-4 h-4 mr-1" />
          Filters
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-background-secondary rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Advanced Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-secondary mb-1">
                Min Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.minScore || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    minScore: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-border rounded focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">
                Max Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.maxScore || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxScore: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-border rounded focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.completedAfter || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    completedAfter: e.target.value || undefined,
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-border rounded focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.completedBefore || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    completedBefore: e.target.value || undefined,
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-border rounded focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-secondary">
              Total Results
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalResults}
          </div>
          <div className="text-xs text-secondary">exam attempts</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-info" />
            <span className="text-sm font-medium text-secondary">Students</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.uniqueStudents}
          </div>
          <div className="text-xs text-secondary">unique students</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-warning" />
            <span className="text-sm font-medium text-secondary">Exams</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.uniqueExams}
          </div>
          <div className="text-xs text-secondary">unique exams</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-secondary">
              Avg Score
            </span>
          </div>
          <div
            className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}
          >
            {stats.averageScore.toFixed(1)}%
          </div>
          <div className="text-xs text-secondary">overall average</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-warning" />
            <span className="text-sm font-medium text-secondary">
              Pass Rate
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.passRate.toFixed(1)}%
          </div>
          <div className="text-xs text-secondary">≥60% threshold</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-info" />
            <span className="text-sm font-medium text-secondary">
              Total Time
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatTime(stats.totalTimeSpent)}
          </div>
          <div className="text-xs text-secondary">study time</div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">
            Exam Results ({filteredResults.length})
          </h3>
        </div>

        {filteredResults.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm ||
              Object.keys(filters).some(
                (key) =>
                  filters[key as keyof ResultsFilters] !== undefined &&
                  filters[key as keyof ResultsFilters] !== ''
              )
                ? 'No Results Found'
                : 'No Exam Results Yet'}
            </h3>
            <p className="text-secondary">
              {searchTerm ||
              Object.keys(filters).some(
                (key) =>
                  filters[key as keyof ResultsFilters] !== undefined &&
                  filters[key as keyof ResultsFilters] !== ''
              )
                ? 'Try adjusting your search or filter criteria'
                : 'Exam results will appear here once students complete exams'}
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
                    Score
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">
                    Date
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">
                    Time
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-background-secondary">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-light text-primary rounded-full flex items-center justify-center text-sm font-medium">
                          {result.exam_sessions?.user_profiles
                            ?.first_name?.[0] || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {result.exam_sessions?.user_profiles?.first_name}{' '}
                            {result.exam_sessions?.user_profiles?.last_name}
                          </div>
                          <div className="text-xs text-secondary">
                            {result.exam_sessions?.user_profiles?.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">
                        {result.exams?.title || 'Unknown Exam'}
                      </div>
                      <div className="text-xs text-secondary">
                        {result.correct_answers}/{result.total_questions}{' '}
                        correct
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div
                        className={`text-sm font-medium ${getScoreColor(result.percentage_score || 0)}`}
                      >
                        {(result.percentage_score || 0).toFixed(1)}%
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          result.requires_manual_grading
                            ? 'bg-warning-light text-warning'
                            : (result.percentage_score || 0) >= 60
                              ? 'bg-success-light text-success'
                              : 'bg-error-light text-error'
                        }`}
                      >
                        {result.requires_manual_grading
                          ? 'Pending Review'
                          : (result.percentage_score || 0) >= 60
                            ? 'Passed'
                            : 'Failed'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">
                        {result.submitted_at
                          ? new Date(result.submitted_at).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">
                        {formatTime(result.time_spent || 0)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => setSelectedResult(result)}
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExaminerResultsView
