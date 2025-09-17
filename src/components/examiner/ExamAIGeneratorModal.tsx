'use client'

import React, { useState } from 'react'
import {
  X,
  Brain,
  Loader,
  CheckCircle,
  AlertTriangle,
  Settings,
  Target,
  Clock,
  BarChart3,
} from 'lucide-react'

export interface ExamGenerationRequest {
  topic: string
  subject?: string
  totalQuestions: number
  duration?: number
  questionTypes: {
    multiple_choice: number
    true_false: number
  }
  difficulty: {
    easy: number
    medium: number
    hard: number
  }
  context?: string
  learningObjectives?: string[]
}

export interface ExamGenerationResult {
  success: boolean
  examData?: {
    title: string
    description: string
    duration: number
    questions: Array<{
      title: string
      content: string
      type: 'multiple_choice' | 'true_false'
      difficulty: 'easy' | 'medium' | 'hard'
      options?: string[]
      correct_answer: string | boolean
      explanation: string
      points: number
      category: string
      tags: string[]
    }>
  }
  metadata?: {
    model_used: string
    generation_time: number
    total_questions: number
  }
  error?: string
}

interface ExamAIGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onExamGenerated: (examData: ExamGenerationResult['examData']) => void
  hasExistingQuestions?: boolean
}

export const ExamAIGeneratorModal: React.FC<ExamAIGeneratorModalProps> = ({
  isOpen,
  onClose,
  onExamGenerated,
  hasExistingQuestions = false,
}) => {
  const [form, setForm] = useState<ExamGenerationRequest>({
    topic: '',
    subject: '',
    totalQuestions: 20,
    duration: 60,
    questionTypes: {
      multiple_choice: 70,
      true_false: 30,
    },
    difficulty: {
      easy: 30,
      medium: 50,
      hard: 20,
    },
    context: '',
    learningObjectives: [],
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] =
    useState<ExamGenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentObjective, setCurrentObjective] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.topic.trim()) {
      setError('Topic is required')
      return
    }

    // Validate percentages sum to 100
    const typeTotal =
      form.questionTypes.multiple_choice + form.questionTypes.true_false
    const difficultyTotal =
      form.difficulty.easy + form.difficulty.medium + form.difficulty.hard

    if (typeTotal !== 100) {
      setError('Question type percentages must sum to 100%')
      return
    }

    if (difficultyTotal !== 100) {
      setError('Difficulty percentages must sum to 100%')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGenerationResult(null)

    try {
      const response = await fetch('/api/exams/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate exam')
      }

      setGenerationResult(data)
      if (data.success && data.examData) {
        onExamGenerated(data.examData)
      }
    } catch (err) {
      console.error('Exam generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate exam')
    } finally {
      setIsGenerating(false)
    }
  }

  const addLearningObjective = () => {
    if (
      currentObjective.trim() &&
      !form.learningObjectives?.includes(currentObjective.trim())
    ) {
      setForm((prev) => ({
        ...prev,
        learningObjectives: [
          ...(prev.learningObjectives || []),
          currentObjective.trim(),
        ],
      }))
      setCurrentObjective('')
    }
  }

  const removeLearningObjective = (index: number) => {
    setForm((prev) => ({
      ...prev,
      learningObjectives:
        prev.learningObjectives?.filter((_, i) => i !== index) || [],
    }))
  }

  const updateQuestionTypePercentage = (
    type: 'multiple_choice' | 'true_false',
    value: number
  ) => {
    const otherType =
      type === 'multiple_choice' ? 'true_false' : 'multiple_choice'
    setForm((prev) => ({
      ...prev,
      questionTypes: {
        ...prev.questionTypes,
        [type]: value,
        [otherType]: 100 - value,
      },
    }))
  }

  const updateDifficultyPercentage = (
    difficulty: 'easy' | 'medium' | 'hard',
    value: number
  ) => {
    setForm((prev) => {
      const remaining = 100 - value
      const otherTwo = Object.keys(prev.difficulty).filter(
        (k) => k !== difficulty
      ) as ('easy' | 'medium' | 'hard')[]
      const currentOther1 = prev.difficulty[otherTwo[0]]
      const currentOther2 = prev.difficulty[otherTwo[1]]
      const otherTotal = currentOther1 + currentOther2

      return {
        ...prev,
        difficulty: {
          ...prev.difficulty,
          [difficulty]: value,
          [otherTwo[0]]:
            otherTotal > 0
              ? Math.round((currentOther1 / otherTotal) * remaining)
              : remaining / 2,
          [otherTwo[1]]:
            otherTotal > 0
              ? Math.round((currentOther2 / otherTotal) * remaining)
              : remaining / 2,
        },
      }
    })
  }

  const getEstimatedTime = () => {
    const mcTime = Math.ceil(
      ((form.totalQuestions * form.questionTypes.multiple_choice) / 100) * 1.5
    )
    const tfTime = Math.ceil(
      ((form.totalQuestions * form.questionTypes.true_false) / 100) * 0.5
    )
    return mcTime + tfTime
  }

  const handleClose = () => {
    if (!isGenerating) {
      setForm({
        topic: '',
        subject: '',
        totalQuestions: 20,
        duration: 60,
        questionTypes: {
          multiple_choice: 70,
          true_false: 30,
        },
        difficulty: {
          easy: 30,
          medium: 50,
          hard: 20,
        },
        context: '',
        learningObjectives: [],
      })
      setGenerationResult(null)
      setError(null)
      setCurrentObjective('')
      setShowAdvanced(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 rounded-full p-2">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Generate Complete Exam with AI
              </h2>
              <p className="text-sm text-gray-500">
                Create a full exam with customized question distribution and
                difficulty
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Warning for existing questions */}
          {hasExistingQuestions && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span className="font-medium text-amber-900">
                  Replace Existing Content
                </span>
              </div>
              <div className="text-sm text-amber-700">
                <p>
                  This will replace all existing questions in your exam with
                  newly generated content.
                </p>
                <p className="mt-1">
                  Consider using &ldquo;Add AI Questions&rdquo; instead if you
                  want to keep existing questions.
                </p>
              </div>
            </div>
          )}

          {/* Generation Result */}
          {generationResult && generationResult.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium text-green-900">
                  Exam Generated Successfully!
                </span>
              </div>
              <div className="text-sm text-green-700">
                <p>
                  Generated exam with{' '}
                  {generationResult.metadata?.total_questions} questions
                </p>
                <p>Model used: {generationResult.metadata?.model_used}</p>
                <p>
                  Generation time:{' '}
                  {(generationResult.metadata?.generation_time / 1000).toFixed(
                    1
                  )}
                  s
                </p>
                <p className="mt-2 font-medium">
                  The exam has been loaded into the exam builder. You can review
                  and customize it before saving.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-900">
                  Generation Failed
                </span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Generation Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.topic}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, topic: e.target.value }))
                  }
                  placeholder="e.g., World War II, Photosynthesis, Calculus"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isGenerating}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  placeholder="e.g., History, Biology, Mathematics"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Exam Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Target className="w-4 h-4 inline mr-1" />
                  Total Questions
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={form.totalQuestions}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      totalQuestions: parseInt(e.target.value) || 20,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="10"
                  max="480"
                  value={form.duration}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      duration: parseInt(e.target.value) || 60,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isGenerating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Suggested: {getEstimatedTime()} minutes
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 mt-6"
                >
                  <Settings className="w-4 h-4" />
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </button>
              </div>
            </div>

            {/* Question Type Distribution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Question Type Distribution
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Multiple Choice: {form.questionTypes.multiple_choice}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.questionTypes.multiple_choice}
                    onChange={(e) =>
                      updateQuestionTypePercentage(
                        'multiple_choice',
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full"
                    disabled={isGenerating}
                  />
                  <div className="text-xs text-gray-500">
                    ~
                    {Math.ceil(
                      (form.totalQuestions *
                        form.questionTypes.multiple_choice) /
                        100
                    )}{' '}
                    questions
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    True/False: {form.questionTypes.true_false}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.questionTypes.true_false}
                    onChange={(e) =>
                      updateQuestionTypePercentage(
                        'true_false',
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full"
                    disabled={isGenerating}
                  />
                  <div className="text-xs text-gray-500">
                    ~
                    {Math.ceil(
                      (form.totalQuestions * form.questionTypes.true_false) /
                        100
                    )}{' '}
                    questions
                  </div>
                </div>
              </div>
            </div>

            {/* Difficulty Distribution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Difficulty Distribution
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Easy: {form.difficulty.easy}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.difficulty.easy}
                    onChange={(e) =>
                      updateDifficultyPercentage(
                        'easy',
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full"
                    disabled={isGenerating}
                  />
                  <div className="text-xs text-gray-500">
                    ~
                    {Math.ceil(
                      (form.totalQuestions * form.difficulty.easy) / 100
                    )}{' '}
                    questions
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Medium: {form.difficulty.medium}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.difficulty.medium}
                    onChange={(e) =>
                      updateDifficultyPercentage(
                        'medium',
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full"
                    disabled={isGenerating}
                  />
                  <div className="text-xs text-gray-500">
                    ~
                    {Math.ceil(
                      (form.totalQuestions * form.difficulty.medium) / 100
                    )}{' '}
                    questions
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Hard: {form.difficulty.hard}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.difficulty.hard}
                    onChange={(e) =>
                      updateDifficultyPercentage(
                        'hard',
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full"
                    disabled={isGenerating}
                  />
                  <div className="text-xs text-gray-500">
                    ~
                    {Math.ceil(
                      (form.totalQuestions * form.difficulty.hard) / 100
                    )}{' '}
                    questions
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <>
                {/* Context */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Context (Optional)
                  </label>
                  <textarea
                    value={form.context}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, context: e.target.value }))
                    }
                    placeholder="Provide additional context, constraints, or specific requirements for the exam..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isGenerating}
                  />
                </div>

                {/* Learning Objectives */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Learning Objectives (Optional)
                  </label>

                  {/* Add Objective Input */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={currentObjective}
                      onChange={(e) => setCurrentObjective(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === 'Enter' &&
                        (e.preventDefault(), addLearningObjective())
                      }
                      placeholder="e.g., Understand historical causes and effects"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={isGenerating}
                    />
                    <button
                      type="button"
                      onClick={addLearningObjective}
                      disabled={isGenerating || !currentObjective.trim()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>

                  {/* Objectives List */}
                  {form.learningObjectives &&
                    form.learningObjectives.length > 0 && (
                      <div className="space-y-2">
                        {form.learningObjectives.map((objective, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg"
                          >
                            <span className="flex-1 text-sm text-purple-900">
                              {objective}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeLearningObjective(index)}
                              disabled={isGenerating}
                              className="text-purple-600 hover:text-purple-800 disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isGenerating}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isGenerating || !form.topic.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Generating Exam...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Generate Complete Exam
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ExamAIGeneratorModal
