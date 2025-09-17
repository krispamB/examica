'use client'

import { nanoid } from 'nanoid'

export interface SessionLock {
  sessionId: string
  lockId: string
  tabId: string
  acquired: number
  lastHeartbeat: number
  isActive: boolean
}

export interface LockStatus {
  hasLock: boolean
  lockOwner?: string
  canAcquire: boolean
  conflictingTabs: number
}

class SessionLockService {
  private readonly LOCK_KEY_PREFIX = 'examica_lock_'
  private readonly HEARTBEAT_INTERVAL = 5000 // 5 seconds
  private readonly LOCK_TIMEOUT = 15000 // 15 seconds
  private readonly tabId: string
  private heartbeatTimer: NodeJS.Timeout | null = null
  private activeLocks = new Set<string>()

  constructor() {
    this.tabId = nanoid()
    this.startHeartbeat()
    this.handleStorageEvents()
    this.handlePageUnload()
  }

  /**
   * Attempt to acquire a lock for an exam session
   */
  async acquireLock(sessionId: string): Promise<{
    success: boolean
    lockId?: string
    conflict?: SessionLock
    message?: string
  }> {
    const lockKey = this.getLockKey(sessionId)
    const lockId = nanoid()

    try {
      // Check for existing lock
      const existingLock = this.getLockFromStorage(lockKey)

      if (existingLock && this.isLockValid(existingLock)) {
        // Check if it's our own lock
        if (existingLock.tabId === this.tabId) {
          // Renew our existing lock
          const renewedLock: SessionLock = {
            ...existingLock,
            lastHeartbeat: Date.now(),
            isActive: true,
          }

          this.saveLockToStorage(lockKey, renewedLock)
          this.activeLocks.add(sessionId)
          return { success: true, lockId: renewedLock.lockId }
        }

        // Another tab has the lock
        return {
          success: false,
          conflict: existingLock,
          message: 'Another tab has control of this exam session',
        }
      }

      // No valid lock exists, acquire new one
      const newLock: SessionLock = {
        sessionId,
        lockId,
        tabId: this.tabId,
        acquired: Date.now(),
        lastHeartbeat: Date.now(),
        isActive: true,
      }

      this.saveLockToStorage(lockKey, newLock)
      this.activeLocks.add(sessionId)

      return { success: true, lockId }
    } catch (error) {
      console.error('Failed to acquire lock:', error)
      return {
        success: false,
        message: 'Failed to acquire session lock',
      }
    }
  }

  /**
   * Release a session lock
   */
  releaseLock(sessionId: string): boolean {
    const lockKey = this.getLockKey(sessionId)

    try {
      const existingLock = this.getLockFromStorage(lockKey)

      // Only release if we own the lock
      if (existingLock && existingLock.tabId === this.tabId) {
        localStorage.removeItem(lockKey)
        sessionStorage.removeItem(lockKey)
        this.activeLocks.delete(sessionId)
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to release lock:', error)
      return false
    }
  }

  /**
   * Check lock status
   */
  getLockStatus(sessionId: string): LockStatus {
    const lockKey = this.getLockKey(sessionId)
    const existingLock = this.getLockFromStorage(lockKey)

    if (!existingLock) {
      return {
        hasLock: false,
        canAcquire: true,
        conflictingTabs: 0,
      }
    }

    if (!this.isLockValid(existingLock)) {
      return {
        hasLock: false,
        canAcquire: true,
        conflictingTabs: 0,
      }
    }

    const hasLock = existingLock.tabId === this.tabId

    return {
      hasLock,
      lockOwner: existingLock.tabId,
      canAcquire: !this.isLockValid(existingLock),
      conflictingTabs: hasLock ? 0 : 1,
    }
  }

  /**
   * Check if current tab has lock
   */
  hasLock(sessionId: string): boolean {
    return this.getLockStatus(sessionId).hasLock
  }

  /**
   * Update heartbeat for active locks
   */
  private updateHeartbeat(): void {
    this.activeLocks.forEach((sessionId) => {
      const lockKey = this.getLockKey(sessionId)
      const existingLock = this.getLockFromStorage(lockKey)

      if (existingLock && existingLock.tabId === this.tabId) {
        const updatedLock: SessionLock = {
          ...existingLock,
          lastHeartbeat: Date.now(),
        }

        this.saveLockToStorage(lockKey, updatedLock)
      } else {
        // Lost the lock, remove from active set
        this.activeLocks.delete(sessionId)
      }
    })
  }

  /**
   * Start heartbeat timer
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.updateHeartbeat()
      this.cleanupExpiredLocks()
    }, this.HEARTBEAT_INTERVAL)
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * Clean up expired locks
   */
  private cleanupExpiredLocks(): void {
    try {
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.LOCK_KEY_PREFIX)) {
          const lock = this.getLockFromStorage(key)
          if (lock && !this.isLockValid(lock)) {
            keysToRemove.push(key)
          }
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })
    } catch (error) {
      console.error('Failed to cleanup expired locks:', error)
    }
  }

  /**
   * Check if lock is still valid
   */
  private isLockValid(lock: SessionLock): boolean {
    const now = Date.now()
    const timeSinceHeartbeat = now - lock.lastHeartbeat

    return lock.isActive && timeSinceHeartbeat < this.LOCK_TIMEOUT
  }

  /**
   * Handle storage events from other tabs
   */
  private handleStorageEvents(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key?.startsWith(this.LOCK_KEY_PREFIX)) {
          // Another tab modified a lock
          const sessionId = event.key.replace(this.LOCK_KEY_PREFIX, '')

          if (event.newValue) {
            const newLock: SessionLock = JSON.parse(event.newValue)

            // If another tab took our lock, remove from active set
            if (
              this.activeLocks.has(sessionId) &&
              newLock.tabId !== this.tabId
            ) {
              this.activeLocks.delete(sessionId)
              this.handleLockConflict(sessionId, newLock)
            }
          } else if (event.oldValue) {
            // Lock was removed
            const oldLock: SessionLock = JSON.parse(event.oldValue)
            if (oldLock.tabId === this.tabId) {
              this.activeLocks.delete(sessionId)
            }
          }
        }
      })
    }
  }

  /**
   * Handle page unload
   */
  private handlePageUnload(): void {
    if (typeof window !== 'undefined') {
      const cleanup = () => {
        this.stopHeartbeat()

        // Release all locks owned by this tab
        this.activeLocks.forEach((sessionId) => {
          this.releaseLock(sessionId)
        })
      }

      window.addEventListener('beforeunload', cleanup)
      window.addEventListener('pagehide', cleanup)

      // Also handle visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          // Page is hidden, but don't release locks yet
          // Just stop heartbeat to conserve resources
          this.stopHeartbeat()
        } else if (document.visibilityState === 'visible') {
          // Page is visible again, resume heartbeat
          this.startHeartbeat()
        }
      })
    }
  }

  /**
   * Handle lock conflicts
   */
  private handleLockConflict(
    sessionId: string,
    conflictingLock: SessionLock
  ): void {
    // Emit custom event for UI to handle
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('examLockConflict', {
        detail: {
          sessionId,
          conflictingLock,
          currentTabId: this.tabId,
        },
      })

      window.dispatchEvent(event)
    }
  }

  /**
   * Force release all locks (emergency function)
   */
  forceReleaseAllLocks(): number {
    let released = 0

    try {
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.LOCK_KEY_PREFIX)) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
        released++
      })

      this.activeLocks.clear()
    } catch (error) {
      console.error('Failed to force release locks:', error)
    }

    return released
  }

  /**
   * Get lock key
   */
  private getLockKey(sessionId: string): string {
    return `${this.LOCK_KEY_PREFIX}${sessionId}`
  }

  /**
   * Get lock from storage
   */
  private getLockFromStorage(key: string): SessionLock | null {
    try {
      // Try localStorage first, then sessionStorage
      const value = localStorage.getItem(key) || sessionStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Failed to parse lock data:', error)
      return null
    }
  }

  /**
   * Save lock to storage
   */
  private saveLockToStorage(key: string, lock: SessionLock): void {
    try {
      const serialized = JSON.stringify(lock)

      // Save to both localStorage and sessionStorage for redundancy
      localStorage.setItem(key, serialized)
      sessionStorage.setItem(key, serialized)
    } catch (error) {
      console.error('Failed to save lock:', error)
      throw error
    }
  }

  /**
   * Get current tab ID
   */
  getTabId(): string {
    return this.tabId
  }

  /**
   * Get all active locks for debugging
   */
  getActiveLocks(): Set<string> {
    return new Set(this.activeLocks)
  }
}

// Singleton instance
export const sessionLockService = new SessionLockService()
export default sessionLockService
