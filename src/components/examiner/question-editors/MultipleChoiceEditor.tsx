'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Plus, X, Check } from 'lucide-react'
import Button from '@/components/ui/Button'

interface MultipleChoiceOption {
  id: string
  text: string
  isCorrect: boolean
}

interface MultipleChoiceEditorProps {
  title: string
  content: string
  options: MultipleChoiceOption[]
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
  onOptionsChange: (
    options: MultipleChoiceOption[],
    correctAnswer: string[]
  ) => void
}

const MultipleChoiceEditor: React.FC<MultipleChoiceEditorProps> = ({
  title,
  content,
  options: initialOptions,
  onTitleChange,
  onContentChange,
  onOptionsChange,
}) => {
  const [options, setOptions] = useState<MultipleChoiceOption[]>(
    initialOptions.length > 0
      ? initialOptions
      : [
          { id: '1', text: '', isCorrect: false },
          { id: '2', text: '', isCorrect: false },
          { id: '3', text: '', isCorrect: false },
          { id: '4', text: '', isCorrect: false },
        ]
  )

  const prevOptionsRef = useRef<MultipleChoiceOption[]>([])

  useEffect(() => {
    // Only call onOptionsChange if options actually changed
    if (JSON.stringify(options) !== JSON.stringify(prevOptionsRef.current)) {
      prevOptionsRef.current = options
      const correctAnswers = options
        .filter((opt) => opt.isCorrect)
        .map((opt) => opt.id)
      onOptionsChange(options, correctAnswers)
    }
  }, [options, onOptionsChange])

  const updateOption = (id: string, text: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, text } : opt))
    )
  }

  const toggleCorrect = (id: string) => {
    setOptions((prev) =>
      prev.map((opt) =>
        opt.id === id ? { ...opt, isCorrect: !opt.isCorrect } : opt
      )
    )
  }

  const addOption = () => {
    const newId = (
      Math.max(...options.map((opt) => parseInt(opt.id))) + 1
    ).toString()
    setOptions((prev) => [...prev, { id: newId, text: '', isCorrect: false }])
  }

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions((prev) => prev.filter((opt) => opt.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Question Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter question title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Question Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Content <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Enter your question here..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
        />
        <p className="text-sm text-gray-500 mt-1">
          Write a clear, specific question for students to answer.
        </p>
      </div>

      {/* Answer Options */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Answer Options <span className="text-red-500">*</span>
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={addOption}
            className="flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Option</span>
          </Button>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                  {String.fromCharCode(65 + index)}
                </span>
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex-shrink-0 flex items-center space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => toggleCorrect(option.id)}
                  className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                    option.isCorrect
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                  }`}
                  title={
                    option.isCorrect ? 'Correct answer' : 'Mark as correct'
                  }
                >
                  <Check className="w-4 h-4" />
                </button>

                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(option.id)}
                    className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                    title="Remove option"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-3">
          Click the checkmark (✓) to mark correct answers. You can select
          multiple correct answers.
        </p>

        {options.filter((opt) => opt.isCorrect).length === 0 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Please mark at least one option as correct.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MultipleChoiceEditor
