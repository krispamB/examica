'use client'

import React from 'react'
import { X, Star, Tag, BookOpen } from 'lucide-react'
import type { Question } from '@/lib/questions/service'

interface QuestionPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  question: Question | null
}

const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({
  isOpen,
  onClose,
  question,
}) => {
  if (!isOpen || !question) return null

  const renderQuestionInput = () => {
    try {
      switch (question.type) {
        case 'multiple_choice':
          if (!question.options || !Array.isArray(question.options)) {
            return (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  ⚠️ This question has invalid options and cannot be displayed
                  properly.
                </p>
              </div>
            )
          }

          return (
            <div className="space-y-3">
              {question.options.map(
                (option: { id?: string; text: string }, index: number) => (
                  <label
                    key={option.id || index}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="preview-answer"
                      className="mt-1 text-blue-600"
                      disabled
                    />
                    <span className="text-gray-800">{option.text}</span>
                  </label>
                )
              )}
            </div>
          )

        case 'true_false':
          return (
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="preview-answer"
                  className="text-blue-600"
                  disabled
                />
                <span className="text-gray-800">True</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="preview-answer"
                  className="text-blue-600"
                  disabled
                />
                <span className="text-gray-800">False</span>
              </label>
            </div>
          )

        case 'essay':
          return (
            <div className="space-y-3">
              <textarea
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                placeholder="Type your answer here..."
                disabled
              />
            </div>
          )

        case 'fill_blank':
          return (
            <div className="space-y-3">
              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="text-gray-600 text-sm mb-3">
                  Fill in the blanks with appropriate answers:
                </p>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your answer..."
                  disabled
                />
              </div>
            </div>
          )

        case 'matching':
          return (
            <div className="space-y-3">
              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="text-gray-600 text-sm mb-3">
                  Match the items from the left column with the right column:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="p-2 bg-gray-50 rounded border">Item 1</div>
                    <div className="p-2 bg-gray-50 rounded border">Item 2</div>
                    <div className="p-2 bg-gray-50 rounded border">Item 3</div>
                  </div>
                  <div className="space-y-2">
                    <select
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled
                    >
                      <option>Select match...</option>
                    </select>
                    <select
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled
                    >
                      <option>Select match...</option>
                    </select>
                    <select
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled
                    >
                      <option>Select match...</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )

        default:
          return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                Preview not available for question type: {question.type}
              </p>
            </div>
          )
      }
    } catch (error) {
      console.error('Error rendering question preview:', error)
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            Error rendering question preview. Please check the question data.
          </p>
        </div>
      )
    }
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'hard':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {getQuestionTypeIcon(question.type)}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Question Preview
                </h3>
                <p className="text-sm text-gray-500">
                  How this question will appear to students
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Question Metadata */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full border ${getDifficultyColor(question.difficulty || 'medium')}`}
              >
                {question.difficulty || 'medium'}
              </span>
              <div className="flex items-center gap-1 text-gray-600">
                <Star className="w-4 h-4" />
                <span className="text-sm">{question.points} points</span>
              </div>
              {question.category && (
                <div className="flex items-center gap-1 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">{question.category}</span>
                </div>
              )}
            </div>

            {question.tags && question.tags.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-gray-500" />
                <div className="flex gap-1 flex-wrap">
                  {question.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Question Title */}
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {question.title}
            </h4>
          </div>

          {/* Question Content */}
          <div className="mb-6">
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {question.content}
              </p>
            </div>
          </div>

          {/* Answer Input */}
          <div className="mb-6">
            <h5 className="text-sm font-medium text-gray-700 mb-3">
              Your Answer:
            </h5>
            {renderQuestionInput()}
          </div>

          {/* Explanation (if available) */}
          {question.explanation && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Explanation (not visible to students during exam):
              </h5>
              <p className="text-sm text-gray-600 leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestionPreviewModal
