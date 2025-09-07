'use client'

import React, { useState } from 'react'
import {
  X,
  Wand2,
  Brain,
  Loader,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import type {
  QuestionType,
  QuestionDifficulty,
  QuestionGenerationRequest,
} from '@/lib/ai/question-generator'

interface GenerateQuestionModalProps {
  isOpen: boolean
  onClose: () => void
  onQuestionsGenerated: () => void
}

interface GenerationForm {
  topic: string
  subject: string
  type: QuestionType
  difficulty: QuestionDifficulty
  count: number
  context: string
  learningObjectives: string[]
  save: boolean
}

export const GenerateQuestionModal: React.FC<GenerateQuestionModalProps> = ({
  isOpen,
  onClose,
  onQuestionsGenerated,
}) => {
  const [form, setForm] = useState<GenerationForm>({
    topic: '',
    subject: '',
    type: 'multiple_choice',
    difficulty: 'medium',
    count: 5,
    context: '',
    learningObjectives: [],
    save: true,
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<{
    questions?: unknown[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentObjective, setCurrentObjective] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.topic.trim()) {
      setError('Topic is required')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGenerationResult(null)

    try {
      const request: QuestionGenerationRequest & { save: boolean } = {
        topic: form.topic.trim(),
        subject: form.subject.trim() || undefined,
        type: form.type,
        difficulty: form.difficulty,
        count: form.count,
        context: form.context.trim() || undefined,
        learningObjectives:
          form.learningObjectives.length > 0
            ? form.learningObjectives
            : undefined,
        save: form.save,
      }

      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate questions')
      }

      setGenerationResult(data)
      if (form.save) {
        onQuestionsGenerated()
      }
    } catch (err) {
      console.error('Question generation error:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to generate questions'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const addLearningObjective = () => {
    if (
      currentObjective.trim() &&
      !form.learningObjectives.includes(currentObjective.trim())
    ) {
      setForm((prev) => ({
        ...prev,
        learningObjectives: [
          ...prev.learningObjectives,
          currentObjective.trim(),
        ],
      }))
      setCurrentObjective('')
    }
  }

  const removeLearningObjective = (index: number) => {
    setForm((prev) => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index),
    }))
  }

  const handleClose = () => {
    if (!isGenerating) {
      setForm({
        topic: '',
        subject: '',
        type: 'multiple_choice',
        difficulty: 'medium',
        count: 5,
        context: '',
        learningObjectives: [],
        save: true,
      })
      setGenerationResult(null)
      setError(null)
      setCurrentObjective('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 rounded-full p-2">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Generate Questions with AI
              </h2>
              <p className="text-sm text-gray-500">
                Create questions using Claude or OpenAI
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
          {/* Generation Result */}
          {generationResult && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium text-green-900">
                  Generation Successful!
                </span>
              </div>
              <div className="text-sm text-green-700">
                <p>Generated {generationResult.generated} questions</p>
                {generationResult.saved > 0 && (
                  <p>
                    Saved {generationResult.saved} questions to the question
                    bank
                  </p>
                )}
                <p>
                  Model used: {generationResult.generation_metadata?.model_used}
                </p>
                <p>
                  Generation time:{' '}
                  {(
                    generationResult.generation_metadata?.generation_time / 1000
                  ).toFixed(1)}
                  s
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
            {/* Topic & Subject */}
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
                  placeholder="e.g., Photosynthesis, World War II, Calculus"
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
                  placeholder="e.g., Biology, History, Mathematics"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Question Type & Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type: e.target.value as QuestionType,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isGenerating}
                >
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
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      difficulty: e.target.value as QuestionDifficulty,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isGenerating}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.count}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      count: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isGenerating}
                />
              </div>
            </div>

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
                placeholder="Provide additional context, constraints, or specific requirements for the questions..."
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
                  placeholder="Enter a learning objective..."
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
              {form.learningObjectives.length > 0 && (
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

            {/* Save Option */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.save}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, save: e.target.checked }))
                  }
                  disabled={isGenerating}
                  className="rounded border-gray-300 text-purple-600 shadow-sm focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  Save generated questions to question bank automatically
                </span>
              </label>
            </div>

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
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Questions
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

export default GenerateQuestionModal
