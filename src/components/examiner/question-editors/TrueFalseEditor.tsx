'use client'

import React from 'react'
import { Check, X } from 'lucide-react'

interface TrueFalseEditorProps {
  title: string
  content: string
  correctAnswer: boolean | null
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
  onCorrectAnswerChange: (answer: boolean) => void
}

const TrueFalseEditor: React.FC<TrueFalseEditorProps> = ({
  title,
  content,
  correctAnswer,
  onTitleChange,
  onContentChange,
  onCorrectAnswerChange,
}) => {
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
          Question Statement <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Enter a statement that can be answered with True or False..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
        />
        <p className="text-sm text-gray-500 mt-1">
          Write a clear statement that students can evaluate as true or false.
        </p>
      </div>

      {/* Correct Answer Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Correct Answer <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-2 gap-4">
          {/* True Option */}
          <button
            type="button"
            onClick={() => onCorrectAnswerChange(true)}
            className={`p-6 border-2 rounded-xl transition-all duration-200 ${
              correctAnswer === true
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div
                className={`p-3 rounded-full ${
                  correctAnswer === true ? 'bg-green-500' : 'bg-gray-100'
                }`}
              >
                <Check
                  className={`w-6 h-6 ${
                    correctAnswer === true ? 'text-white' : 'text-gray-400'
                  }`}
                />
              </div>
              <span className="text-lg font-semibold">True</span>
              <p className="text-sm text-center opacity-75">
                The statement is correct
              </p>
            </div>
          </button>

          {/* False Option */}
          <button
            type="button"
            onClick={() => onCorrectAnswerChange(false)}
            className={`p-6 border-2 rounded-xl transition-all duration-200 ${
              correctAnswer === false
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div
                className={`p-3 rounded-full ${
                  correctAnswer === false ? 'bg-red-500' : 'bg-gray-100'
                }`}
              >
                <X
                  className={`w-6 h-6 ${
                    correctAnswer === false ? 'text-white' : 'text-gray-400'
                  }`}
                />
              </div>
              <span className="text-lg font-semibold">False</span>
              <p className="text-sm text-center opacity-75">
                The statement is incorrect
              </p>
            </div>
          </button>
        </div>

        {correctAnswer === null && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Please select the correct answer (True or False).
            </p>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-3">
          Select whether the statement you&apos;ve written is true or false.
        </p>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          💡 Tips for True/False Questions:
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • Avoid absolute terms like &ldquo;always,&rdquo;
            &ldquo;never,&rdquo; &ldquo;all,&rdquo; or &ldquo;none&rdquo;
          </li>
          <li>• Make statements clear and unambiguous</li>
          <li>• Ensure the statement is factual and verifiable</li>
          <li>• Avoid trick questions that rely on technicalities</li>
        </ul>
      </div>
    </div>
  )
}

export default TrueFalseEditor
