'use client'

import React from 'react'
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  Save,
  Upload,
  AlertCircle,
} from 'lucide-react'

export type SyncStatus =
  | 'draft'
  | 'saving'
  | 'saved'
  | 'syncing'
  | 'synced'
  | 'error'
  | 'offline'
  | 'conflict'

export interface AnswerStatusProps {
  status: SyncStatus
  lastSaved?: number
  lastSynced?: number
  error?: string
  pendingCount?: number
  onRetry?: () => void
  onResolveConflict?: () => void
  className?: string
}

const AnswerStatusIndicator: React.FC<AnswerStatusProps> = ({
  status,
  lastSaved,
  lastSynced,
  error,
  pendingCount = 0,
  onRetry,
  onResolveConflict,
  className = '',
}) => {
  const getStatusConfig = (status: SyncStatus) => {
    switch (status) {
      case 'draft':
        return {
          icon: Clock,
          text: 'Draft',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          description: 'Changes saved locally',
        }

      case 'saving':
        return {
          icon: Save,
          text: 'Saving...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          description: 'Saving to local storage',
          animate: true,
        }

      case 'saved':
        return {
          icon: CheckCircle,
          text: 'Saved',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          description: 'Saved locally',
        }

      case 'syncing':
        return {
          icon: Upload,
          text: 'Syncing...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          description: 'Uploading to server',
          animate: true,
        }

      case 'synced':
        return {
          icon: CheckCircle,
          text: 'Synced',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          description: 'All changes synchronized',
        }

      case 'error':
        return {
          icon: AlertTriangle,
          text: 'Error',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          description: error || 'Failed to sync changes',
        }

      case 'offline':
        return {
          icon: WifiOff,
          text: 'Offline',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          description: `${pendingCount} changes queued for sync`,
        }

      case 'conflict':
        return {
          icon: AlertCircle,
          text: 'Conflict',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          description: 'Changes conflict detected',
        }

      default:
        return {
          icon: Clock,
          text: 'Unknown',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          description: 'Status unknown',
        }
    }
  }

  const formatTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp

    if (diff < 60000) {
      // Less than 1 minute
      return 'Just now'
    }

    if (diff < 3600000) {
      // Less than 1 hour
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m ago`
    }

    if (diff < 86400000) {
      // Less than 1 day
      const hours = Math.floor(diff / 3600000)
      return `${hours}h ago`
    }

    return new Date(timestamp).toLocaleString()
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Status Badge */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}
        title={config.description}
      >
        <Icon
          className={`w-3.5 h-3.5 ${config.animate ? 'animate-spin' : ''}`}
        />
        <span>{config.text}</span>

        {/* Pending count for offline status */}
        {status === 'offline' && pendingCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-orange-200 text-orange-800 rounded-full text-xs">
            {pendingCount}
          </span>
        )}
      </div>

      {/* Network Status */}
      <div className="flex items-center gap-1">
        {navigator?.onLine === false ? (
          <WifiOff
            className="w-3.5 h-3.5 text-red-500"
            title="No internet connection"
          />
        ) : (
          <Wifi className="w-3.5 h-3.5 text-green-500" title="Connected" />
        )}
      </div>

      {/* Action Buttons */}
      {status === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          title="Retry sync"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}

      {status === 'conflict' && onResolveConflict && (
        <button
          onClick={onResolveConflict}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-md transition-colors"
          title="Resolve conflict"
        >
          <AlertCircle className="w-3 h-3" />
          Resolve
        </button>
      )}

      {/* Timestamps */}
      <div className="text-xs text-gray-500 space-y-0.5">
        {lastSaved && (
          <div title={`Saved: ${new Date(lastSaved).toLocaleString()}`}>
            Saved {formatTime(lastSaved)}
          </div>
        )}
        {lastSynced && status !== 'draft' && (
          <div title={`Synced: ${new Date(lastSynced).toLocaleString()}`}>
            Synced {formatTime(lastSynced)}
          </div>
        )}
      </div>
    </div>
  )
}

export default AnswerStatusIndicator

// Extended version with detailed panel
export interface DetailedStatusProps extends AnswerStatusProps {
  showDetails?: boolean
  unsyncedAnswers?: number
  totalAnswers?: number
  storageUsage?: number
  maxStorage?: number
}

export const DetailedAnswerStatus: React.FC<DetailedStatusProps> = ({
  showDetails = false,
  unsyncedAnswers = 0,
  totalAnswers = 0,
  storageUsage = 0,
  maxStorage = 100,
  ...props
}) => {
  if (!showDetails) {
    return <AnswerStatusIndicator {...props} />
  }

  const storagePercentage =
    maxStorage > 0 ? (storageUsage / maxStorage) * 100 : 0

  return (
    <div className="bg-white border border-border rounded-lg p-4 space-y-4">
      <AnswerStatusIndicator {...props} />

      {/* Detailed Information */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-600">Answers</div>
          <div className="font-medium">
            {totalAnswers} total
            {unsyncedAnswers > 0 && (
              <span className="ml-2 text-orange-600">
                ({unsyncedAnswers} pending)
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="text-gray-600">Storage</div>
          <div className="font-medium">
            {storagePercentage.toFixed(1)}% used
          </div>
          {storagePercentage > 80 && (
            <div className="text-xs text-orange-600 mt-1">
              Storage nearly full
            </div>
          )}
        </div>
      </div>

      {/* Storage Usage Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Storage Usage</span>
          <span>
            {(storageUsage / 1024).toFixed(1)}KB /{' '}
            {(maxStorage / 1024).toFixed(1)}KB
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              storagePercentage > 90
                ? 'bg-red-500'
                : storagePercentage > 70
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(storagePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Error Details */}
      {props.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-800">
            <div className="font-medium mb-1">Error Details:</div>
            <div>{props.error}</div>
          </div>
        </div>
      )}
    </div>
  )
}
