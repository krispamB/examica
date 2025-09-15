'use client'

import { nanoid } from 'nanoid'

export interface LocalAnswer {
  questionId: string
  response: unknown
  timestamp: number
  synced: boolean
  hash?: string
}

export interface ExamSessionData {
  sessionId: string
  examId: string
  answers: Record<string, LocalAnswer>
  lastSaved: number
  lastSynced: number | null
  version: number
  lockId: string
  isActive: boolean
}

export interface StorageStats {
  size: number
  maxSize: number
  usage: number
}

class ExamSessionStorage {
  private readonly STORAGE_KEY_PREFIX = 'examica_session_'
  private readonly BACKUP_KEY_PREFIX = 'examica_backup_'
  private readonly MAX_STORAGE_SIZE = 4 * 1024 * 1024 // 4MB limit
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor() {
    this.startCleanupTimer()
    this.handleStorageEvents()
  }

  /**
   * Initialize or load exam session data
   */
  initSession(sessionId: string, examId: string): ExamSessionData {
    const key = this.getStorageKey(sessionId)
    const lockId = nanoid()

    try {
      const existing = this.getFromStorage(key)
      if (existing) {
        // Update lock and mark as active
        existing.lockId = lockId
        existing.isActive = true
        existing.version += 1
        this.saveToStorage(key, existing)
        return existing
      }
    } catch (error) {
      console.warn('Failed to load existing session, creating new:', error)
    }

    // Create new session data
    const sessionData: ExamSessionData = {
      sessionId,
      examId,
      answers: {},
      lastSaved: Date.now(),
      lastSynced: null,
      version: 1,
      lockId,
      isActive: true,
    }

    this.saveToStorage(key, sessionData)
    return sessionData
  }

  /**
   * Save answer locally
   */
  saveAnswer(
    sessionId: string,
    questionId: string,
    response: unknown,
    synced: boolean = false
  ): boolean {
    const key = this.getStorageKey(sessionId)

    try {
      const sessionData = this.getFromStorage(key)
      if (!sessionData) {
        throw new Error('Session not found')
      }

      const answer: LocalAnswer = {
        questionId,
        response,
        timestamp: Date.now(),
        synced,
        hash: this.hashAnswer(response),
      }

      sessionData.answers[questionId] = answer
      sessionData.lastSaved = Date.now()
      sessionData.version += 1

      if (synced) {
        sessionData.lastSynced = Date.now()
      }

      return this.saveToStorage(key, sessionData)
    } catch (error) {
      console.error('Failed to save answer locally:', error)
      return false
    }
  }

  /**
   * Get all answers for a session
   */
  getAnswers(sessionId: string): Record<string, LocalAnswer> {
    const key = this.getStorageKey(sessionId)
    const sessionData = this.getFromStorage(key)
    return sessionData?.answers || {}
  }

  /**
   * Get unsynchronized answers
   */
  getUnsyncedAnswers(sessionId: string): Record<string, LocalAnswer> {
    const answers = this.getAnswers(sessionId)
    const unsynced: Record<string, LocalAnswer> = {}

    Object.entries(answers).forEach(([questionId, answer]) => {
      if (!answer.synced) {
        unsynced[questionId] = answer
      }
    })

    return unsynced
  }

  /**
   * Mark answers as synced
   */
  markAnswersSynced(sessionId: string, questionIds: string[]): boolean {
    const key = this.getStorageKey(sessionId)

    try {
      const sessionData = this.getFromStorage(key)
      if (!sessionData) return false

      questionIds.forEach((questionId) => {
        if (sessionData.answers[questionId]) {
          sessionData.answers[questionId].synced = true
        }
      })

      sessionData.lastSynced = Date.now()
      sessionData.version += 1

      return this.saveToStorage(key, sessionData)
    } catch (error) {
      console.error('Failed to mark answers as synced:', error)
      return false
    }
  }

  /**
   * Get session data
   */
  getSessionData(sessionId: string): ExamSessionData | null {
    const key = this.getStorageKey(sessionId)
    return this.getFromStorage(key)
  }

  /**
   * Clear session data
   */
  clearSession(sessionId: string): boolean {
    const key = this.getStorageKey(sessionId)
    const backupKey = this.getBackupKey(sessionId)

    try {
      localStorage.removeItem(key)
      localStorage.removeItem(backupKey)
      sessionStorage.removeItem(key)
      sessionStorage.removeItem(backupKey)
      return true
    } catch (error) {
      console.error('Failed to clear session:', error)
      return false
    }
  }

  /**
   * Create backup of session data
   */
  createBackup(sessionId: string): boolean {
    const key = this.getStorageKey(sessionId)
    const backupKey = this.getBackupKey(sessionId)

    try {
      const sessionData = this.getFromStorage(key)
      if (!sessionData) return false

      const backup = {
        ...sessionData,
        backupTime: Date.now(),
      }

      // Try localStorage first, fallback to sessionStorage
      return this.saveToStorage(backupKey, backup, true)
    } catch (error) {
      console.error('Failed to create backup:', error)
      return false
    }
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(sessionId: string): ExamSessionData | null {
    const backupKey = this.getBackupKey(sessionId)

    try {
      // Try localStorage first
      const backup =
        localStorage.getItem(backupKey) || sessionStorage.getItem(backupKey)
      if (!backup) return null

      const data = JSON.parse(backup)
      delete data.backupTime // Remove backup metadata

      // Restore to main storage
      const key = this.getStorageKey(sessionId)
      this.saveToStorage(key, data)

      return data
    } catch (error) {
      console.error('Failed to restore from backup:', error)
      return null
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): StorageStats {
    let totalSize = 0

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.STORAGE_KEY_PREFIX)) {
          const value = localStorage.getItem(key)
          if (value) {
            totalSize += new Blob([value]).size
          }
        }
      }
    } catch (error) {
      console.warn('Failed to calculate storage stats:', error)
    }

    return {
      size: totalSize,
      maxSize: this.MAX_STORAGE_SIZE,
      usage: totalSize / this.MAX_STORAGE_SIZE,
    }
  }

  /**
   * Validate session integrity
   */
  validateSession(sessionId: string): {
    isValid: boolean
    issues: string[]
  } {
    const issues: string[] = []

    try {
      const sessionData = this.getSessionData(sessionId)

      if (!sessionData) {
        issues.push('Session data not found')
        return { isValid: false, issues }
      }

      if (!sessionData.sessionId || sessionData.sessionId !== sessionId) {
        issues.push('Invalid session ID')
      }

      if (!sessionData.examId) {
        issues.push('Missing exam ID')
      }

      if (!sessionData.lockId) {
        issues.push('Missing lock ID')
      }

      // Check answer integrity
      Object.entries(sessionData.answers).forEach(([questionId, answer]) => {
        if (!answer.questionId || answer.questionId !== questionId) {
          issues.push(`Invalid question ID for ${questionId}`)
        }

        if (!answer.timestamp || answer.timestamp > Date.now()) {
          issues.push(`Invalid timestamp for ${questionId}`)
        }

        // Verify hash if present
        if (answer.hash && answer.hash !== this.hashAnswer(answer.response)) {
          issues.push(`Hash mismatch for ${questionId}`)
        }
      })

      return {
        isValid: issues.length === 0,
        issues,
      }
    } catch (error) {
      issues.push(
        `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      return { isValid: false, issues }
    }
  }

  /**
   * Clean up old sessions
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): number {
    let cleaned = 0
    const cutoff = Date.now() - maxAge

    try {
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.STORAGE_KEY_PREFIX)) {
          const value = localStorage.getItem(key)
          if (value) {
            const data = JSON.parse(value)
            if (data.lastSaved < cutoff) {
              keysToRemove.push(key)
            }
          }
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key)
        cleaned++
      })
    } catch (error) {
      console.error('Cleanup error:', error)
    }

    return cleaned
  }

  private getStorageKey(sessionId: string): string {
    return `${this.STORAGE_KEY_PREFIX}${sessionId}`
  }

  private getBackupKey(sessionId: string): string {
    return `${this.BACKUP_KEY_PREFIX}${sessionId}`
  }

  private getFromStorage(key: string): ExamSessionData | null {
    try {
      // Try localStorage first, then sessionStorage
      const value = localStorage.getItem(key) || sessionStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Failed to parse storage data:', error)
      return null
    }
  }

  private saveToStorage(
    key: string,
    data: ExamSessionData,
    isBackup: boolean = false
  ): boolean {
    try {
      const serialized = JSON.stringify(data)
      const size = new Blob([serialized]).size

      // Check size limits
      if (size > this.MAX_STORAGE_SIZE / 4) {
        // 1MB per session
        console.warn('Session data approaching size limit')
      }

      // Try localStorage first
      try {
        localStorage.setItem(key, serialized)
        return true
      } catch (quotaError) {
        console.warn('localStorage quota exceeded, trying sessionStorage')

        // Fallback to sessionStorage
        try {
          sessionStorage.setItem(key, serialized)

          if (!isBackup) {
            // Trigger cleanup on quota issues
            this.cleanup()
          }

          return true
        } catch (sessionError) {
          console.error(
            'Both localStorage and sessionStorage failed:',
            sessionError
          )
          return false
        }
      }
    } catch (error) {
      console.error('Failed to save to storage:', error)
      return false
    }
  }

  private hashAnswer(response: unknown): string {
    // Simple hash for client-side integrity checking
    const str = JSON.stringify(response)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.CLEANUP_INTERVAL)
  }

  private handleStorageEvents(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key?.startsWith(this.STORAGE_KEY_PREFIX)) {
          console.log('External storage change detected:', event.key)
          // Handle external changes if needed
        }
      })

      // Cleanup on page unload
      window.addEventListener('beforeunload', () => {
        if (this.cleanupTimer) {
          clearInterval(this.cleanupTimer)
        }
      })
    }
  }
}

// Singleton instance
export const examSessionStorage = new ExamSessionStorage()
export default examSessionStorage
