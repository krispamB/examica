'use client'

import React, { useState } from 'react'
import { X, Save, Eye, Settings } from 'lucide-react'
import Button from '@/components/ui/Button'
import MultipleChoiceEditor from './question-editors/MultipleChoiceEditor'
import TrueFalseEditor from './question-editors/TrueFalseEditor'
import QuestionMetadataSection from './question-editors/QuestionMetadataSection'

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'essay'
  | 'fill_blank'
  | 'matching'
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

interface OptionData {
  id: string
  text: string
  isCorrect: boolean
  [key: string]: unknown
}

export interface QuestionFormData {
  title: string
  content: string
  type: QuestionType
  difficulty: QuestionDifficulty
  category: string
  tags: string[]
  options: OptionData[] | null
  correct_answer: string | string[] | boolean | null
  explanation: string
  points: number
}

interface QuestionCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (question: QuestionFormData) => Promise<void>
  onPreview?: (question: QuestionFormData) => void
}

const QuestionCreationModal: React.FC<QuestionCreationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onPreview,
}) => {
  const [currentStep, setCurrentStep] = useState<
    'type' | 'content' | 'preview'
  >('type')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<QuestionFormData>({
    title: '',
    content: '',
    type: 'multiple_choice',
    difficulty: 'medium',
    category: '',
    tags: [],
    options: null,
    correct_answer: null,
    explanation: '',
    points: 1,
  })

  const questionTypes = [
    {
      type: 'multiple_choice' as QuestionType,
      title: 'Multiple Choice',
      description: 'Select one correct answer from multiple options',
      icon: '📋',
      popular: true,
    },
    {
      type: 'true_false' as QuestionType,
      title: 'True or False',
      description: 'Simple true or false questions',
      icon: '✅',
      popular: true,
    },
    {
      type: 'essay' as QuestionType,
      title: 'Essay',
      description: 'Open-ended written responses',
      icon: '📝',
      popular: false,
    },
    {
      type: 'fill_blank' as QuestionType,
      title: 'Fill in the Blank',
      description: 'Complete sentences with missing words',
      icon: '✏️',
      popular: false,
    },
    {
      type: 'matching' as QuestionType,
      title: 'Matching',
      description: 'Match items from two columns',
      icon: '🔗',
      popular: false,
    },
  ]

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Failed to save question:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = () => {
    if (onPreview) {
      onPreview(formData)
    }
    setCurrentStep('preview')
  }

  const isFormValid = () => {
    if (!formData.content.trim()) return false

    if (formData.type === 'multiple_choice') {
      const options = formData.options || []
      if (options.length < 2) return false
      if (!options.some((opt) => opt.text?.trim())) return false
      if (
        !formData.correct_answer ||
        (Array.isArray(formData.correct_answer) &&
          formData.correct_answer.length === 0)
      )
        return false
    }

    if (formData.type === 'true_false') {
      if (
        formData.correct_answer === null ||
        formData.correct_answer === undefined
      )
        return false
    }

    return true
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Create New Question
            </h2>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${currentStep === 'type' ? 'bg-blue-600' : 'bg-gray-300'}`}
              />
              <div
                className={`w-2 h-2 rounded-full ${currentStep === 'content' ? 'bg-blue-600' : 'bg-gray-300'}`}
              />
              <div
                className={`w-2 h-2 rounded-full ${currentStep === 'preview' ? 'bg-blue-600' : 'bg-gray-300'}`}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {currentStep === 'content' && (
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!isFormValid()}
                className="flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </Button>
            )}

            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          {currentStep === 'type' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Choose Question Type
                </h3>
                <p className="text-gray-600">
                  Select the type of question you want to create
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {questionTypes.map((type) => (
                  <div
                    key={type.type}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, type: type.type }))
                      setCurrentStep('content')
                    }}
                    className={`
                      relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md
                      ${
                        formData.type === type.type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {type.popular && (
                      <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        Popular
                      </div>
                    )}

                    <div className="text-3xl mb-3">{type.icon}</div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {type.title}
                    </h4>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'content' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Create{' '}
                  {questionTypes.find((t) => t.type === formData.type)?.title}{' '}
                  Question
                </h3>
                <p className="text-gray-600">
                  Fill in the details for your question
                </p>
              </div>

              {/* Question Type-specific Editor */}
              <div className="space-y-8">
                {formData.type === 'multiple_choice' && (
                  <MultipleChoiceEditor
                    title={formData.title}
                    content={formData.content}
                    options={(formData.options as any) || []}
                    onTitleChange={(title) =>
                      setFormData((prev) => ({ ...prev, title }))
                    }
                    onContentChange={(content) =>
                      setFormData((prev) => ({ ...prev, content }))
                    }
                    onOptionsChange={(options, correctAnswer) =>
                      setFormData((prev) => ({
                        ...prev,
                        options: options as OptionData[],
                        correct_answer: correctAnswer,
                      }))
                    }
                  />
                )}

                {formData.type === 'true_false' && (
                  <TrueFalseEditor
                    title={formData.title}
                    content={formData.content}
                    correctAnswer={formData.correct_answer as boolean | null}
                    onTitleChange={(title) =>
                      setFormData((prev) => ({ ...prev, title }))
                    }
                    onContentChange={(content) =>
                      setFormData((prev) => ({ ...prev, content }))
                    }
                    onCorrectAnswerChange={(answer) =>
                      setFormData((prev) => ({
                        ...prev,
                        correct_answer: answer,
                      }))
                    }
                  />
                )}

                {!['multiple_choice', 'true_false'].includes(formData.type) && (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Question editor for {formData.type} coming soon!
                    </p>
                    <Button
                      onClick={() => setCurrentStep('type')}
                      variant="outline"
                    >
                      Back to Question Types
                    </Button>
                  </div>
                )}

                {/* Question Metadata Section */}
                {['multiple_choice', 'true_false'].includes(formData.type) && (
                  <div className="border-t border-gray-200 pt-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Question Settings
                    </h4>
                    <QuestionMetadataSection
                      difficulty={formData.difficulty}
                      category={formData.category}
                      tags={formData.tags}
                      points={formData.points}
                      explanation={formData.explanation}
                      onDifficultyChange={(difficulty) =>
                        setFormData((prev) => ({ ...prev, difficulty }))
                      }
                      onCategoryChange={(category) =>
                        setFormData((prev) => ({ ...prev, category }))
                      }
                      onTagsChange={(tags) =>
                        setFormData((prev) => ({ ...prev, tags }))
                      }
                      onPointsChange={(points) =>
                        setFormData((prev) => ({ ...prev, points }))
                      }
                      onExplanationChange={(explanation) =>
                        setFormData((prev) => ({ ...prev, explanation }))
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'preview' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Question Preview
                </h3>
                <p className="text-gray-600">
                  Preview how your question will appear to students
                </p>
              </div>

              {/* Question Preview */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="space-y-6">
                  {/* Question Header */}
                  <div className="border-b border-gray-200 pb-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {(formData.title as string) || 'Untitled Question'}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            (formData.difficulty as string) === 'easy'
                              ? 'bg-green-100 text-green-800'
                              : (formData.difficulty as string) === 'hard'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {formData.difficulty as string}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formData.points as number}{' '}
                          {(formData.points as number) === 1
                            ? 'point'
                            : 'points'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <>
                    <div>
                      <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
                        {String(formData.content || '')}
                      </p>
                    </div>

                    {/* Answer Options */}
                    {formData.type === 'multiple_choice' &&
                      formData.options &&
                      Array.isArray(formData.options) && (
                        <div className="space-y-3">
                          {(
                            formData.options as Array<{
                              id: string
                              text: string
                              isCorrect: boolean
                            }>
                          ).map((option, index) => (
                            <div
                              key={option.id}
                              className={`p-3 border rounded-lg ${
                                option.isCorrect
                                  ? 'border-green-200 bg-green-50'
                                  : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                                  {String.fromCharCode(65 + index)}
                                </span>
                                <span className="text-gray-900">
                                  {option.text}
                                </span>
                                {option.isCorrect && (
                                  <span className="ml-auto text-green-600 text-sm font-medium">
                                    ✓ Correct
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    {formData.type === 'true_false' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className={`p-4 border rounded-lg text-center ${
                            formData.correct_answer === true
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <span className="text-lg font-medium">True</span>
                          {formData.correct_answer === true && (
                            <div className="text-green-600 text-sm font-medium mt-1">
                              ✓ Correct Answer
                            </div>
                          )}
                        </div>
                        <div
                          className={`p-4 border rounded-lg text-center ${
                            formData.correct_answer === false
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <span className="text-lg font-medium">False</span>
                          {formData.correct_answer === false && (
                            <div className="text-green-600 text-sm font-medium mt-1">
                              ✓ Correct Answer
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Question Metadata */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {formData.category && (
                          <span>
                            Category:{' '}
                            <span className="font-medium">
                              {formData.category}
                            </span>
                          </span>
                        )}
                        {formData.tags && formData.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <span>Tags:</span>
                            <div className="flex space-x-1">
                              {formData.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {formData.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <h5 className="text-sm font-medium text-blue-900 mb-1">
                            Explanation:
                          </h5>
                          <p className="text-sm text-blue-800">
                            {formData.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Step{' '}
              {currentStep === 'type'
                ? '1'
                : currentStep === 'content'
                  ? '2'
                  : '3'}{' '}
              of 3
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {currentStep !== 'type' && (
              <Button
                variant="outline"
                onClick={() => {
                  if (currentStep === 'content') setCurrentStep('type')
                  if (currentStep === 'preview') setCurrentStep('content')
                }}
              >
                Back
              </Button>
            )}

            {currentStep === 'preview' && (
              <Button
                onClick={handleSave}
                loading={isLoading}
                disabled={!isFormValid()}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Question</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionCreationModal
