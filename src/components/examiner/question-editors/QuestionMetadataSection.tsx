'use client'

import React, { useState } from 'react'
import { Plus, X, Tag, Award, BookOpen } from 'lucide-react'
import type { QuestionDifficulty } from '../QuestionCreationModal'

interface QuestionMetadataSectionProps {
  difficulty: QuestionDifficulty
  category: string
  tags: string[]
  points: number
  explanation: string
  onDifficultyChange: (difficulty: QuestionDifficulty) => void
  onCategoryChange: (category: string) => void
  onTagsChange: (tags: string[]) => void
  onPointsChange: (points: number) => void
  onExplanationChange: (explanation: string) => void
}

const QuestionMetadataSection: React.FC<QuestionMetadataSectionProps> = ({
  difficulty,
  category,
  tags,
  points,
  explanation,
  onDifficultyChange,
  onCategoryChange,
  onTagsChange,
  onPointsChange,
  onExplanationChange,
}) => {
  const [newTag, setNewTag] = useState('')

  const difficulties = [
    {
      value: 'easy',
      label: 'Easy',
      color: 'bg-green-100 text-green-800 border-green-200',
    },
    {
      value: 'medium',
      label: 'Medium',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    {
      value: 'hard',
      label: 'Hard',
      color: 'bg-red-100 text-red-800 border-red-200',
    },
  ] as const

  const commonCategories = [
    'Mathematics',
    'Science',
    'History',
    'English',
    'Programming',
    'Business',
    'Physics',
    'Chemistry',
    'Biology',
    'Psychology',
  ]

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="space-y-6">
      {/* Difficulty Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Award className="w-4 h-4 inline mr-1" />
          Difficulty Level
        </label>
        <div className="grid grid-cols-3 gap-3">
          {difficulties.map((diff) => (
            <button
              key={diff.value}
              type="button"
              onClick={() => onDifficultyChange(diff.value)}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                difficulty === diff.value
                  ? diff.color + ' border-opacity-100'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <span className="font-medium">{diff.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Points */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Points
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="1"
            max="100"
            value={points}
            onChange={(e) =>
              onPointsChange(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-sm text-gray-500">points (1-100)</span>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <BookOpen className="w-4 h-4 inline mr-1" />
          Category
        </label>
        <div className="space-y-2">
          <input
            type="text"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            placeholder="Enter category or select from suggestions..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            list="categories"
          />
          <datalist id="categories">
            {commonCategories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>

          <div className="flex flex-wrap gap-2 mt-2">
            {commonCategories
              .filter(
                (cat) =>
                  cat.toLowerCase().includes(category.toLowerCase()) &&
                  cat.toLowerCase() !== category.toLowerCase()
              )
              .slice(0, 5)
              .map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onCategoryChange(cat)}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                >
                  {cat}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Tag className="w-4 h-4 inline mr-1" />
          Tags
        </label>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a tag..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addTag}
              disabled={!newTag.trim() || tags.includes(newTag.trim())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Explanation (Optional)
        </label>
        <textarea
          value={explanation}
          onChange={(e) => onExplanationChange(e.target.value)}
          placeholder="Provide an explanation for the correct answer..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
        />
        <p className="text-sm text-gray-500 mt-1">
          This explanation will be shown to students after they submit their
          answer.
        </p>
      </div>
    </div>
  )
}

export default QuestionMetadataSection
