'use client'

import React, { useState, useEffect } from 'react'
import { Trophy, Clock, FileText, TrendingUp, Calendar, Eye } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { ExamResultWithDetails } from '@/lib/results/service'

interface ExamResultsHistoryProps {
  userId?: string
  className?: string
}

const ExamResultsHistory: React.FC<ExamResultsHistoryProps> = ({
  userId,
  className = ''
}) => {
  const [results, setResults] = useState<ExamResultWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<ExamResultWithDetails | null>(null)

  useEffect(() => {
    loadResults()
  }, [userId])

  const loadResults = async () => {
    try {
      setError(null)

      const params = new URLSearchParams()
      if (userId) params.append('user_id', userId)
      params.append('include_details', 'true')
      params.append('limit', '50')

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
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-success'
    if (percentage >= 80) return 'text-info'
    if (percentage >= 70) return 'text-warning'
    if (percentage >= 60) return 'text-primary'
    return 'text-error'
  }

  const getGradeLetter = (percentage: number): string => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  const calculateStats = () => {
    if (results.length === 0) {
      return {
        totalExams: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        passedExams: 0,
        passRate: 0
      }
    }

    const totalScore = results.reduce((sum, r) => sum + (r.percentage_score || 0), 0)
    const averageScore = totalScore / results.length
    const totalTimeSpent = results.reduce((sum, r) => sum + (r.time_spent || 0), 0)
    const passedExams = results.filter(r => (r.percentage_score || 0) >= 60).length
    const passRate = (passedExams / results.length) * 100

    return {
      totalExams: results.length,
      averageScore,
      totalTimeSpent,
      passedExams,
      passRate
    }
  }

  const stats = calculateStats()

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Results</h3>
          <p className="text-secondary mb-6">{error}</p>
          <Button onClick={loadResults}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">Exam History</h2>
        <p className="text-secondary">Your exam performance and results</p>
      </div>

      {/* Stats Cards */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-background rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-secondary">Total Exams</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.totalExams}</div>
            <div className="text-xs text-secondary">{stats.passedExams} passed</div>
          </div>

          <div className="bg-background rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="text-sm font-medium text-secondary">Average Score</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
              {stats.averageScore.toFixed(1)}%
            </div>
            <div className="text-xs text-secondary">
              Grade: {getGradeLetter(stats.averageScore)}
            </div>
          </div>

          <div className="bg-background rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-info" />
              <span className="text-sm font-medium text-secondary">Time Spent</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatTime(stats.totalTimeSpent)}
            </div>
            <div className="text-xs text-secondary">
              Total study time
            </div>
          </div>

          <div className="bg-background rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-warning" />
              <span className="text-sm font-medium text-secondary">Pass Rate</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stats.passRate.toFixed(1)}%
            </div>
            <div className="text-xs text-secondary">
              {stats.passedExams}/{stats.totalExams} passed
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">Recent Exams</h3>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Exam Results</h3>
            <p className="text-secondary">You haven&apos;t completed any exams yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {results.map((result) => (
              <div key={result.id} className="p-6 hover:bg-background-secondary">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-foreground mb-1">
                      {result.exams?.title || 'Unknown Exam'}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-secondary">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(result.submitted_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(result.time_spent || 0)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(result.percentage_score || 0)}`}>
                      {(result.percentage_score || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-secondary">
                      {result.correct_answers}/{result.total_questions} correct
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Grade Badge */}
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      (result.percentage_score || 0) >= 60 
                        ? 'bg-success-light text-success' 
                        : 'bg-error-light text-error'
                    }`}>
                      {(result.percentage_score || 0) >= 60 ? 'Passed' : 'Failed'}
                    </div>

                    {/* Manual Grading Badge */}
                    {result.requires_manual_grading && (
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-warning-light text-warning">
                        Pending Review
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => setSelectedResult(result)}
                    variant="ghost"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-background-tertiary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (result.percentage_score || 0) >= 60 ? 'bg-success' : 'bg-error'
                      }`}
                      style={{ width: `${result.percentage_score || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Result Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Exam Results</h3>
              <Button
                onClick={() => setSelectedResult(null)}
                variant="ghost"
                size="sm"
              >
                ×
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Exam Info */}
              <div>
                <h4 className="text-xl font-medium text-foreground mb-2">
                  {selectedResult.exams?.title || 'Unknown Exam'}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-secondary">Completed:</span>
                    <div className="text-foreground">
                      {new Date(selectedResult.submitted_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-secondary">Time Spent:</span>
                    <div className="text-foreground">
                      {formatTime(selectedResult.time_spent || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Details */}
              <div className="bg-background-secondary rounded-lg p-4">
                <h5 className="font-medium text-foreground mb-3">Score Breakdown</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(selectedResult.percentage_score || 0)}`}>
                      {(selectedResult.percentage_score || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-secondary">Final Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">
                      {selectedResult.correct_answers}/{selectedResult.total_questions}
                    </div>
                    <div className="text-sm text-secondary">Correct Answers</div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-secondary mb-1">
                    <span>Progress</span>
                    <span>{(selectedResult.percentage_score || 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-background-tertiary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (selectedResult.percentage_score || 0) >= 60 ? 'bg-success' : 'bg-error'
                      }`}
                      style={{ width: `${selectedResult.percentage_score || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Grading Status */}
              {selectedResult.requires_manual_grading && (
                <div className="bg-warning-light border border-warning/20 rounded-lg p-4">
                  <h5 className="font-medium text-warning mb-1">Manual Grading Required</h5>
                  <p className="text-sm text-warning">
                    This exam contains essay questions that require manual review. 
                    Final scores will be available once grading is complete.
                  </p>
                </div>
              )}

              {selectedResult.grader_notes && (
                <div className="bg-info-light border border-info/20 rounded-lg p-4">
                  <h5 className="font-medium text-info mb-1">Instructor Feedback</h5>
                  <p className="text-sm text-info">{selectedResult.grader_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExamResultsHistory