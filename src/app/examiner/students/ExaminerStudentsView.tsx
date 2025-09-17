'use client'

import React, { useState, useEffect } from 'react'
import { Users, Trophy, Clock, FileText, Eye, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import ExamResultsHistory from '@/components/student/ExamResultsHistory'
import type { ExamResultWithDetails } from '@/lib/results/service'

interface ExaminerStudentsViewProps {
  userId: string
  userRole: string
}

interface StudentSummary {
  id: string
  first_name: string
  last_name: string
  email: string
  totalAttempts: number
  averageScore: number
  lastExamDate: string | null
  passRate: number
}

const ExaminerStudentsView: React.FC<ExaminerStudentsViewProps> = ({
  userId,
}) => {
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all')

  useEffect(() => {
    loadStudentsData()
  }, [userId])

  const loadStudentsData = async () => {
    try {
      setError(null)

      // Load exam results to build student summaries
      const params = new URLSearchParams()
      params.append('include_details', 'true')
      params.append('limit', '100')

      const response = await fetch(`/api/exam-results?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load student data')
      }

      const resultsData = data.results || []

      // Build student summaries from results
      const studentMap = new Map<string, StudentSummary>()

      resultsData.forEach((result: ExamResultWithDetails) => {
        const studentId = result.user_id
        const student = result.exam_sessions?.user_profiles

        if (!student || !studentId) return

        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            id: studentId,
            first_name: student.first_name,
            last_name: student.last_name,
            email: student.email,
            totalAttempts: 0,
            averageScore: 0,
            lastExamDate: null,
            passRate: 0,
          })
        }

        const studentSummary = studentMap.get(studentId)!
        studentSummary.totalAttempts++

        // Update last exam date
        if (
          result.submitted_at &&
          (!studentSummary.lastExamDate ||
            result.submitted_at > studentSummary.lastExamDate)
        ) {
          studentSummary.lastExamDate = result.submitted_at
        }
      })

      // Calculate averages and pass rates
      studentMap.forEach((student) => {
        const studentResults = resultsData.filter(
          (r: ExamResultWithDetails) => r.user_id === student.id
        )

        if (studentResults.length > 0) {
          const totalScore = studentResults.reduce(
            (sum: number, r: ExamResultWithDetails) =>
              sum + (r.percentage_score || 0),
            0
          )
          student.averageScore = totalScore / studentResults.length

          const passedExams = studentResults.filter(
            (r: ExamResultWithDetails) => (r.percentage_score || 0) >= 60
          ).length
          student.passRate = (passedExams / studentResults.length) * 100
        }
      })

      setStudents(Array.from(studentMap.values()))
    } catch (err) {
      console.error('Load students data error:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to load student data'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      `${student.first_name} ${student.last_name} ${student.email}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

    let matchesFilter = true
    if (filterStatus === 'active') {
      matchesFilter = Boolean(
        student.lastExamDate &&
          new Date(student.lastExamDate) >
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      )
    } else if (filterStatus === 'inactive') {
      matchesFilter =
        !student.lastExamDate ||
        new Date(student.lastExamDate) <=
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }

    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-success'
    if (score >= 80) return 'text-info'
    if (score >= 70) return 'text-warning'
    if (score >= 60) return 'text-primary'
    return 'text-error'
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
        <Users className="w-12 h-12 text-error mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Error Loading Students
        </h3>
        <p className="text-secondary mb-6">{error}</p>
        <Button onClick={loadStudentsData}>Try Again</Button>
      </div>
    )
  }

  // Show student detail view
  if (selectedStudent) {
    const student = students.find((s) => s.id === selectedStudent)

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setSelectedStudent(null)}
            variant="ghost"
            size="sm"
          >
            ← Back to Students
          </Button>

          {student && (
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {student.first_name} {student.last_name}
              </h2>
              <p className="text-secondary">{student.email}</p>
            </div>
          )}
        </div>

        <ExamResultsHistory userId={selectedStudent} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')
          }
          className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="all">All Students</option>
          <option value="active">Active (Last 30 days)</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-secondary">
              Total Students
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {students.length}
          </div>
          <div className="text-xs text-secondary">Enrolled</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-info" />
            <span className="text-sm font-medium text-secondary">
              Total Attempts
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {students.reduce((sum, s) => sum + s.totalAttempts, 0)}
          </div>
          <div className="text-xs text-secondary">All exams</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-secondary">
              Avg Score
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {students.length > 0
              ? (
                  students.reduce((sum, s) => sum + s.averageScore, 0) /
                  students.length
                ).toFixed(1)
              : 0}
            %
          </div>
          <div className="text-xs text-secondary">Overall average</div>
        </div>

        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-warning" />
            <span className="text-sm font-medium text-secondary">
              Pass Rate
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {students.length > 0
              ? (
                  students.reduce((sum, s) => sum + s.passRate, 0) /
                  students.length
                ).toFixed(1)
              : 0}
            %
          </div>
          <div className="text-xs text-secondary">≥60% threshold</div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">
            Students ({filteredStudents.length})
          </h3>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm || filterStatus !== 'all'
                ? 'No Students Found'
                : 'No Students Yet'}
            </h3>
            <p className="text-secondary">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Students will appear here once they start taking exams'}
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
                    Attempts
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">
                    Avg Score
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">
                    Pass Rate
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-secondary">
                    Last Exam
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-background-secondary"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-light text-primary rounded-full flex items-center justify-center text-sm font-medium">
                          {student.first_name?.[0] || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-xs text-secondary">
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">
                        {student.totalAttempts}
                      </div>
                      <div className="text-xs text-secondary">
                        exam attempts
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div
                        className={`text-sm font-medium ${getScoreColor(student.averageScore)}`}
                      >
                        {student.averageScore.toFixed(1)}%
                      </div>
                      <div className="text-xs text-secondary">average</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">
                        {student.passRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-secondary">passed</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">
                        {formatDate(student.lastExamDate)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => setSelectedStudent(student.id)}
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

export default ExaminerStudentsView
