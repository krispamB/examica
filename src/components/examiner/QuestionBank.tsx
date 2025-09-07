'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  Plus,
  Wand2,
  Edit,
  Trash2,
  Eye,
  Brain,
  User,
  Clock,
  Tag,
  Target,
} from 'lucide-react'
import type { Question, QuestionFilters } from '@/lib/questions/service'

interface QuestionBankProps {
  className?: string
}

type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'essay'
  | 'fill_blank'
  | 'matching'
type QuestionDifficulty = 'easy' | 'medium' | 'hard'

export const QuestionBank: React.FC<QuestionBankProps> = ({
  className = '',
}) => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // Filters and search
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<QuestionFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Modals
  const [_showCreateModal, setShowCreateModal] = useState(false)
  const [_showGenerateModal, setShowGenerateModal] = useState(false)
  const [_selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  )

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search }),
        ...(filters.type && { type: filters.type }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.category && { category: filters.category }),
        ...(filters.aiGenerated !== undefined && {
          ai_generated: filters.aiGenerated.toString(),
        }),
        ...(filters.tags && { tags: filters.tags.join(',') }),
      })

      const response = await fetch(`/api/questions?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch questions')
      }

      setQuestions(data.questions || [])
      setTotalCount(data.totalCount || 0)
    } catch (err) {
      console.error('Error fetching questions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, search, filters])

  // Effects
  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchQuestions()
  }

  const handleFilterChange = (newFilters: Partial<QuestionFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    )
  }

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([])
    } else {
      setSelectedQuestions(questions.map((q) => q.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedQuestions.length === 0) return

    if (!confirm(`Delete ${selectedQuestions.length} selected questions?`))
      return

    try {
      const response = await fetch('/api/questions/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedQuestions }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete questions')
      }

      setSelectedQuestions([])
      fetchQuestions()
    } catch (err) {
      console.error('Error deleting questions:', err)
      alert('Failed to delete questions')
    }
  }

  // Format functions
  const formatQuestionType = (type: QuestionType) => {
    return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getDifficultyColor = (difficulty: QuestionDifficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-50'
      case 'medium':
        return 'text-orange-600 bg-orange-50'
      case 'hard':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getTypeIcon = (type: QuestionType) => {
    switch (type) {
      case 'multiple_choice':
        return '○'
      case 'true_false':
        return '✓'
      case 'essay':
        return '✍'
      case 'fill_blank':
        return '___'
      case 'matching':
        return '⚡'
      default:
        return '?'
    }
  }

  if (loading && questions.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-600">Loading questions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Question Bank
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {totalCount} questions • {selectedQuestions.length} selected
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Generate with AI
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Question
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions by title or content..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          {selectedQuestions.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={filters.type || ''}
                  onChange={(e) =>
                    handleFilterChange({ type: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="essay">Essay</option>
                  <option value="fill_blank">Fill in the Blank</option>
                  <option value="matching">Matching</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={filters.difficulty || ''}
                  onChange={(e) =>
                    handleFilterChange({
                      difficulty: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source
                </label>
                <select
                  value={filters.aiGenerated?.toString() || ''}
                  onChange={(e) =>
                    handleFilterChange({
                      aiGenerated: e.target.value
                        ? e.target.value === 'true'
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sources</option>
                  <option value="true">AI Generated</option>
                  <option value="false">Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={filters.category || ''}
                  onChange={(e) =>
                    handleFilterChange({
                      category: e.target.value || undefined,
                    })
                  }
                  placeholder="Enter category..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setFilters({})
                  setSearch('')
                  setCurrentPage(1)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {questions.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No questions found
            </h3>
            <p className="text-gray-500 mb-6">
              {search || Object.keys(filters).length > 0
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first question or generating some with AI.'}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Question
              </button>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Generate with AI
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Select All */}
            {questions.length > 0 && (
              <div className="mb-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.length === questions.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    Select all questions on this page
                  </span>
                </label>
              </div>
            )}

            {/* Questions Grid */}
            <div className="space-y-4">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    selectedQuestions.includes(question.id)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(question.id)}
                      onChange={() => handleQuestionSelect(question.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                    />

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-mono">
                            {getTypeIcon(question.type as QuestionType)}
                          </span>
                          <h3 className="font-medium text-gray-900 truncate">
                            {question.title}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty as QuestionDifficulty)}`}
                          >
                            {question.difficulty}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedQuestion(question)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {question.content}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {formatQuestionType(question.type as QuestionType)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {question.points} points
                        </span>
                        {question.category && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full" />
                            {question.category}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {question.ai_generated ? (
                            <Brain className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {question.ai_generated ? 'AI Generated' : 'Manual'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(question.created_at!).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalCount > itemsPerPage && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, totalCount)} of{' '}
                  {totalCount} questions
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">
                    Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={
                      currentPage >= Math.ceil(totalCount / itemsPerPage)
                    }
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals would go here - CreateQuestionModal, GenerateQuestionModal, QuestionPreviewModal */}
      {/* These will be implemented in separate components */}
    </div>
  )
}

export default QuestionBank
