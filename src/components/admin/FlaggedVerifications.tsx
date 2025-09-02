'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Eye, Clock, User, RefreshCw } from 'lucide-react'

interface FlaggedVerificationAttempt {
  userId: string
  userName: string
  userEmail: string
  timestamp: string
  success: boolean
  similarity: number
  confidence: number
  error?: string
  institutionId?: string
}

interface FlaggedVerificationsProps {
  className?: string
}

interface UserGroup {
  user: {
    id: string
    name: string
    email: string
    institutionId?: string
  }
  attempts: FlaggedVerificationAttempt[]
  lastAttempt: string
  totalAttempts: number
}

export const FlaggedVerifications: React.FC<FlaggedVerificationsProps> = ({
  className = ''
}) => {
  const [flaggedAttempts, setFlaggedAttempts] = useState<FlaggedVerificationAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAttempt, setSelectedAttempt] = useState<FlaggedVerificationAttempt | null>(null)

  // Fetch flagged verification attempts
  const fetchFlaggedAttempts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/flagged-verifications')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch flagged verifications')
      }

      setFlaggedAttempts(data.flaggedAttempts || [])
    } catch (err) {
      console.error('Error fetching flagged verifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlaggedAttempts()
  }, [])

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  // Get similarity score color
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 70) return 'text-orange-600'
    if (similarity >= 50) return 'text-red-600'
    return 'text-red-700'
  }

  // Group attempts by user
  const groupedAttempts = flaggedAttempts.reduce((acc, attempt) => {
    const key = attempt.userId
    if (!acc[key]) {
      acc[key] = {
        user: {
          id: attempt.userId,
          name: attempt.userName,
          email: attempt.userEmail,
          institutionId: attempt.institutionId,
        },
        attempts: [],
        lastAttempt: attempt.timestamp,
        totalAttempts: 0,
      }
    }
    acc[key].attempts.push(attempt)
    acc[key].totalAttempts++
    if (new Date(attempt.timestamp) > new Date(acc[key].lastAttempt)) {
      acc[key].lastAttempt = attempt.timestamp
    }
    return acc
  }, {} as Record<string, UserGroup>)

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-600">Loading flagged verifications...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchFlaggedAttempts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (flaggedAttempts.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center py-12">
          <div className="bg-green-50 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Flagged Verifications</h3>
          <p className="text-gray-600">All identity verification attempts are passing successfully.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">Flagged Verifications</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {Object.keys(groupedAttempts).length} users with failed attempts
            </span>
            <button
              onClick={fetchFlaggedAttempts}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="divide-y divide-gray-200">
        {Object.values(groupedAttempts).map((userGroup: UserGroup) => (
          <div key={userGroup.user.id} className="p-6">
            {/* User Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-50 rounded-full p-2">
                  <User className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{userGroup.user.name}</h3>
                  <p className="text-sm text-gray-500">{userGroup.user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {userGroup.totalAttempts} failed attempt{userGroup.totalAttempts !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(userGroup.lastAttempt)}
                </div>
              </div>
            </div>

            {/* Attempts List */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                {userGroup.attempts.slice(0, 3).map((attempt: FlaggedVerificationAttempt, index: number) => (
                  <div key={index} className="bg-white rounded-md p-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">
                            {formatTimestamp(attempt.timestamp)}
                          </span>
                          <span className={`font-medium ${getSimilarityColor(attempt.similarity)}`}>
                            {attempt.similarity.toFixed(1)}% similarity
                          </span>
                          <span className="text-gray-600">
                            {attempt.confidence.toFixed(1)}% confidence
                          </span>
                        </div>
                        {attempt.error && (
                          <div className="text-xs text-red-600 mt-1">
                            Error: {attempt.error}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedAttempt(attempt)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Details
                      </button>
                    </div>
                  </div>
                ))}
                
                {userGroup.attempts.length > 3 && (
                  <div className="text-center">
                    <span className="text-xs text-gray-500">
                      and {userGroup.attempts.length - 3} more attempt{userGroup.attempts.length - 3 !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Verification Attempt Details</h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <div className="text-sm text-gray-900">{selectedAttempt.userName}</div>
                <div className="text-xs text-gray-500">{selectedAttempt.userEmail}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                <div className="text-sm text-gray-900">{formatTimestamp(selectedAttempt.timestamp)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Similarity</label>
                  <div className={`text-sm font-medium ${getSimilarityColor(selectedAttempt.similarity)}`}>
                    {selectedAttempt.similarity.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confidence</label>
                  <div className="text-sm text-gray-900">{selectedAttempt.confidence.toFixed(1)}%</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="text-sm text-red-600 font-medium">Verification Failed</div>
              </div>

              {selectedAttempt.error && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Error Details</label>
                  <div className="text-sm text-red-600 bg-red-50 rounded p-2">
                    {selectedAttempt.error}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlaggedVerifications