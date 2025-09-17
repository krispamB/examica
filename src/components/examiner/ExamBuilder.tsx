'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Save,
  Plus,
  Trash2,
  GripVertical,
  Search,
  Clock,
  Shield,
  Eye,
  CheckCircle,
  X,
  Brain,
  Wand2,
} from 'lucide-react'
import type { Question } from '@/lib/questions/service'
import type { ExamCreateData } from '@/lib/exams/service'
import QuestionCreationModal, {
  type QuestionFormData,
} from './QuestionCreationModal'
import ExamAIGeneratorModal from './ExamAIGeneratorModal'
import GenerateQuestionModal from './GenerateQuestionModal'

interface ExamBuilderProps {
  examId?: string // For editing existing exams
  onSave?: (exam: { id: string; title: string; description?: string }) => void
  className?: string
}

interface ExamQuestion {
  question_id: string
  order_index: number
  points?: number
  required?: boolean
  question?: Question // Populated question data
}

interface ExamForm {
  title: string
  description: string
  duration: number | null
  requires_verification: boolean
  questions: ExamQuestion[]
}

export const ExamBuilder: React.FC<ExamBuilderProps> = ({
  examId,
  onSave,
  className = '',
}) => {
  const [form, setForm] = useState<ExamForm>({
    title: '',
    description: '',
    duration: 60,
    requires_verification: true,
    questions: [],
  })

  // Modal states
  const [showQuestionBrowser, setShowQuestionBrowser] = useState(false)
  const [showQuestionCreator, setShowQuestionCreator] = useState(false)
  const [showExamAIGenerator, setShowExamAIGenerator] = useState(false)
  const [showQuestionAIGenerator, setShowQuestionAIGenerator] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load existing exam if editing
  useEffect(() => {
    if (examId) {
      loadExam(examId)
    }
  }, [examId])

  const loadExam = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/exams/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load exam')
      }

      const exam = data.exam
      setForm({
        title: exam.title,
        description: exam.description || '',
        duration: exam.duration,
        requires_verification: exam.requires_verification ?? true,
        questions:
          exam.exam_questions?.map(
            (eq: {
              question_id: string
              order_index: number
              points?: number
              required?: boolean
              questions?: Question
            }) => ({
              question_id: eq.question_id,
              order_index: eq.order_index,
              points: eq.points || eq.questions?.points,
              required: eq.required ?? true,
              question: eq.questions,
            })
          ) || [],
      })
    } catch (err) {
      console.error('Error loading exam:', err)
      setError(err instanceof Error ? err.message : 'Failed to load exam')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Exam title is required')
      return
    }

    if (form.questions.length === 0) {
      setError('Exam must have at least one question')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const examData: ExamCreateData = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        duration: form.duration || undefined,
        requires_verification: form.requires_verification,
        questions: form.questions.map((q) => ({
          question_id: q.question_id,
          order_index: q.order_index,
          points: q.points,
          required: q.required ?? true,
        })),
      }

      const url = examId ? `/api/exams/${examId}` : '/api/exams'
      const method = examId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(examData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save exam')
      }

      if (onSave) {
        onSave(data.exam)
      }
    } catch (err) {
      console.error('Error saving exam:', err)
      setError(err instanceof Error ? err.message : 'Failed to save exam')
    } finally {
      setSaving(false)
    }
  }

  const addQuestion = (question: Question) => {
    if (form.questions.some((q) => q.question_id === question.id)) {
      return // Question already added
    }

    const newQuestion: ExamQuestion = {
      question_id: question.id,
      order_index: form.questions.length,
      points: question.points || undefined,
      required: true,
      question,
    }

    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }))
  }

  const removeQuestion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, order_index: i })), // Reindex
    }))
  }

  const createQuestion = async (
    questionData: QuestionFormData
  ): Promise<void> => {
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create question')
      }

      const result = await response.json()

      // Add the newly created question to the exam
      if (result.question) {
        addQuestion(result.question)
      }
    } catch (error) {
      console.error('Failed to create question:', error)
      throw error
    }
  }

  const updateQuestion = (index: number, updates: Partial<ExamQuestion>) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, ...updates } : q
      ),
    }))
  }

  // moveQuestion function removed as it's not currently used

  const getTotalPoints = () => {
    return form.questions.reduce((sum, q) => sum + (q.points || 1), 0)
  }

  // AI Generation Handlers
  const handleExamAIGenerated = async (examData: {
    title: string
    description: string
    duration: number
    questions: Array<{
      title: string
      content: string
      type: 'multiple_choice' | 'true_false'
      difficulty: 'easy' | 'medium' | 'hard'
      options?: Array<{ id: string; text: string; isCorrect: boolean }> | null
      correct_answer: string | string[]
      explanation: string
      points: number
      category: string
      tags: string[]
    }>
  }) => {
    try {
      setError(null)
      setSaving(true)

      // First, create the questions in the database
      const response = await fetch('/api/questions/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: examData.questions,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create questions')
      }

      const result = await response.json()

      if (!result.success || !result.questions) {
        throw new Error('Failed to create questions in database')
      }

      // Update form with generated exam data using real question IDs
      setForm((prev) => ({
        ...prev,
        title: examData.title || prev.title,
        description: examData.description || prev.description,
        duration: examData.duration || prev.duration,
        questions: result.questions.map(
          (question: Question, index: number) => ({
            question_id: question.id, // Real database ID
            order_index: index,
            points: question.points || 1,
            required: true,
            question: question,
          })
        ),
      }))

      setShowExamAIGenerator(false)
    } catch (error) {
      console.error('Failed to create AI questions:', error)
      setError(
        error instanceof Error ? error.message : 'Failed to create AI questions'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleQuestionsGenerated = () => {
    setShowQuestionAIGenerator(false)
    // Optionally refresh question browser or show success message
  }

  const getQuestionTypeIcon = (type: string) => {
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

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-600">Loading exam...</span>
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
              {examId ? 'Edit Exam' : 'Create New Exam'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {form.questions.length} questions • {getTotalPoints()} total
              points
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Context-aware AI generation buttons */}
            <div className="flex items-center gap-2">
              {form.questions.length === 0 ? (
                <>
                  {/* Primary: Complete exam generation when exam is empty */}
                  <button
                    onClick={() => setShowExamAIGenerator(true)}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-2 transition-colors"
                    title="Generate a complete exam with AI-powered questions"
                  >
                    <Brain className="w-4 h-4" />
                    Generate Complete Exam
                  </button>
                  {/* Secondary: Option to just add questions */}
                  <button
                    onClick={() => setShowQuestionAIGenerator(true)}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center gap-1 transition-colors text-sm"
                    title="Or just generate individual questions"
                  >
                    <Wand2 className="w-3 h-3" />
                    Questions Only
                  </button>
                </>
              ) : (
                <>
                  {/* Primary: Add questions when exam has content */}
                  <button
                    onClick={() => setShowQuestionAIGenerator(true)}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center gap-2 transition-colors"
                    title="Add AI-generated questions to this exam"
                  >
                    <Wand2 className="w-4 h-4" />
                    Add AI Questions
                  </button>
                  {/* Secondary: Option to regenerate entire exam */}
                  <button
                    onClick={() => setShowExamAIGenerator(true)}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center gap-1 transition-colors text-sm"
                    title="Or generate a complete new exam structure"
                  >
                    <Brain className="w-3 h-3" />
                    Full Exam
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => setShowQuestionBrowser(true)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Questions
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {examId ? 'Update Exam' : 'Create Exam'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter exam title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe the exam, its objectives, and any special instructions..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440" // 24 hours max
                  value={form.duration || ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      duration: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    }))
                  }
                  placeholder="e.g., 60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.requires_verification}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        requires_verification: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    <Shield className="w-4 h-4 inline mr-1" />
                    Require facial verification
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Questions ({form.questions.length})
          </h3>

          {form.questions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 mb-4">No questions added yet</p>
              <button
                onClick={() => setShowQuestionBrowser(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Your First Question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {form.questions.map((examQuestion, index) => (
                <div
                  key={examQuestion.question_id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start gap-4">
                    {/* Drag Handle */}
                    <button className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </button>

                    {/* Question Number */}
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
                      {index + 1}
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {getQuestionTypeIcon(
                            examQuestion.question?.type || ''
                          )}
                        </span>
                        <h4 className="font-medium text-gray-900">
                          {examQuestion.question?.title || 'Loading...'}
                        </h4>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {examQuestion.question?.type?.replace('_', ' ')}
                        </span>
                      </div>

                      {examQuestion.question?.content && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {examQuestion.question.content}
                        </p>
                      )}

                      {/* Question Settings */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-700">
                            Points:
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={examQuestion.points || ''}
                            onChange={(e) =>
                              updateQuestion(index, {
                                points: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              })
                            }
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>

                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={examQuestion.required}
                            onChange={(e) =>
                              updateQuestion(index, {
                                required: e.target.checked,
                              })
                            }
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                          />
                          Required
                        </label>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeQuestion(index)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Question Browser Modal */}
      {showQuestionBrowser && (
        <QuestionBrowserModal
          isOpen={showQuestionBrowser}
          onClose={() => setShowQuestionBrowser(false)}
          onSelectQuestion={addQuestion}
          selectedQuestionIds={form.questions.map((q) => q.question_id)}
          onCreateNewQuestion={() => {
            setShowQuestionBrowser(false)
            setShowQuestionCreator(true)
          }}
        />
      )}

      {/* Question Creation Modal */}
      <QuestionCreationModal
        isOpen={showQuestionCreator}
        onClose={() => setShowQuestionCreator(false)}
        onSave={createQuestion}
      />

      {/* AI Generation Modals */}
      <ExamAIGeneratorModal
        isOpen={showExamAIGenerator}
        onClose={() => setShowExamAIGenerator(false)}
        onExamGenerated={handleExamAIGenerated}
        hasExistingQuestions={form.questions.length > 0}
      />

      <GenerateQuestionModal
        isOpen={showQuestionAIGenerator}
        onClose={() => setShowQuestionAIGenerator(false)}
        onQuestionsGenerated={handleQuestionsGenerated}
      />
    </div>
  )
}

// Question Browser Modal Component
interface QuestionBrowserModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectQuestion: (question: Question) => void
  selectedQuestionIds: string[]
  onCreateNewQuestion: () => void
}

const QuestionBrowserModal: React.FC<QuestionBrowserModalProps> = ({
  isOpen,
  onClose,
  onSelectQuestion,
  selectedQuestionIds,
  onCreateNewQuestion,
}) => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<{
    type?: string
    difficulty?: string
  }>({})

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '50',
        ...(search && { search }),
        ...(filters.type && { type: filters.type }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
      })

      const response = await fetch(`/api/questions?${params}`)
      const data = await response.json()

      if (response.ok) {
        setQuestions(data.questions || [])
      }
    } catch (err) {
      console.error('Error loading questions:', err)
    } finally {
      setLoading(false)
    }
  }, [search, filters])

  useEffect(() => {
    if (isOpen) {
      loadQuestions()
    }
  }, [isOpen, loadQuestions])

  const getQuestionTypeIcon = (type: string) => {
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

  const getDifficultyColor = (difficulty: string) => {
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Add Questions to Exam
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={onCreateNewQuestion}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Question
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={filters.type || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  type: e.target.value || undefined,
                }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True/False</option>
              <option value="essay">Essay</option>
              <option value="fill_blank">Fill Blank</option>
              <option value="matching">Matching</option>
            </select>

            <select
              value={filters.difficulty || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  difficulty: e.target.value || undefined,
                }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Questions List */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" />
              <span className="ml-3 text-gray-600">Loading questions...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No questions found</p>
              <button
                onClick={onCreateNewQuestion}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Question
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question) => {
                const isSelected = selectedQuestionIds.includes(question.id)

                return (
                  <div
                    key={question.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => !isSelected && onSelectQuestion(question)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-1">
                        {getQuestionTypeIcon(question.type)}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {question.title}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}
                          >
                            {question.difficulty}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {question.content}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{question.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{question.points} points</span>
                          {question.category && (
                            <>
                              <span>•</span>
                              <span>{question.category}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Plus className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExamBuilder
