import { getRedisClient } from './client'
import type { Redis } from 'ioredis'

export interface ExamSessionData {
  sessionId: string
  examId: string
  timeLimit: number
  startTime: number
}

export interface AnswerData {
  questionId: string
  answer: string | number | boolean
  timestamp: number
}

export class RedisExamStorage {
  private redis: Redis

  constructor() {
    this.redis = getRedisClient()
  }

  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`
  }

  async initExamSession(
    sessionId: string,
    examId: string,
    timeLimit: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const sessionKey = this.getSessionKey(sessionId)
      const ttlSeconds = timeLimit * 60 + 300 // exam time + 5 minutes buffer

      // Set initial session metadata
      await this.redis.hset(sessionKey, {
        examId,
        timeLimit: timeLimit.toString(),
        startTime: Date.now().toString(),
        status: 'active',
      })

      // Set TTL for automatic cleanup
      await this.redis.expire(sessionKey, ttlSeconds)

      console.log(
        `Initialized exam session ${sessionId} with TTL: ${ttlSeconds}s`
      )
      return { success: true }
    } catch (error) {
      console.error('Error initializing exam session:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to initialize session',
      }
    }
  }

  async saveAnswer(
    sessionId: string,
    questionId: string,
    answer: string | number | boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const sessionKey = this.getSessionKey(sessionId)

      // Store answer with timestamp
      const answerData = JSON.stringify({
        answer,
        timestamp: Date.now(),
      })

      await this.redis.hset(sessionKey, questionId, answerData)

      return { success: true }
    } catch (error) {
      console.error('Error saving answer:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save answer',
      }
    }
  }

  async getAnswer(
    sessionId: string,
    questionId: string
  ): Promise<{
    success: boolean
    answer?: string | number | boolean
    error?: string
  }> {
    try {
      const sessionKey = this.getSessionKey(sessionId)
      const answerData = await this.redis.hget(sessionKey, questionId)

      if (!answerData) {
        return { success: true }
      }

      const parsed = JSON.parse(answerData)
      return { success: true, answer: parsed.answer }
    } catch (error) {
      console.error('Error getting answer:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get answer',
      }
    }
  }

  async getAllAnswers(
    sessionId: string
  ): Promise<{
    success: boolean
    answers?: Record<string, string | number | boolean>
    error?: string
  }> {
    try {
      const sessionKey = this.getSessionKey(sessionId)
      const allData = await this.redis.hgetall(sessionKey)

      const answers: Record<string, string | number | boolean> = {}

      // Filter out metadata fields and parse answers
      Object.entries(allData).forEach(([key, value]) => {
        // Skip metadata fields
        if (['examId', 'timeLimit', 'startTime', 'status'].includes(key)) {
          return
        }

        try {
          const parsed = JSON.parse(value)
          answers[key] = parsed.answer
        } catch {
          // If parsing fails, treat as raw value (backward compatibility)
          answers[key] = value
        }
      })

      return { success: true, answers }
    } catch (error) {
      console.error('Error getting all answers:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get answers',
      }
    }
  }

  async getAnswerCount(
    sessionId: string
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const sessionKey = this.getSessionKey(sessionId)
      const allKeys = await this.redis.hkeys(sessionKey)

      // Filter out metadata fields
      const answerKeys = allKeys.filter(
        (key) => !['examId', 'timeLimit', 'startTime', 'status'].includes(key)
      )

      return { success: true, count: answerKeys.length }
    } catch (error) {
      console.error('Error getting answer count:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get answer count',
      }
    }
  }

  async getSessionMetadata(
    sessionId: string
  ): Promise<{
    success: boolean
    metadata?: Partial<ExamSessionData>
    error?: string
  }> {
    try {
      const sessionKey = this.getSessionKey(sessionId)
      const metadata = await this.redis.hmget(
        sessionKey,
        'examId',
        'timeLimit',
        'startTime',
        'status'
      )

      if (!metadata[0]) {
        return { success: false, error: 'Session not found' }
      }

      return {
        success: true,
        metadata: {
          sessionId,
          examId: metadata[0],
          timeLimit: metadata[1] ? parseInt(metadata[1]) : 0,
          startTime: metadata[2] ? parseInt(metadata[2]) : 0,
        },
      }
    } catch (error) {
      console.error('Error getting session metadata:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get session metadata',
      }
    }
  }

  async sessionExists(
    sessionId: string
  ): Promise<{ success: boolean; exists?: boolean; error?: string }> {
    try {
      const sessionKey = this.getSessionKey(sessionId)
      const exists = await this.redis.exists(sessionKey)

      return { success: true, exists: exists === 1 }
    } catch (error) {
      console.error('Error checking session existence:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check session existence',
      }
    }
  }

  async clearSession(
    sessionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const sessionKey = this.getSessionKey(sessionId)
      await this.redis.del(sessionKey)

      console.log(`Cleared exam session: ${sessionId}`)
      return { success: true }
    } catch (error) {
      console.error('Error clearing session:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to clear session',
      }
    }
  }

  async extendSession(
    sessionId: string,
    additionalMinutes: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const sessionKey = this.getSessionKey(sessionId)
      const additionalSeconds = additionalMinutes * 60

      await this.redis.expire(sessionKey, additionalSeconds)

      console.log(
        `Extended session ${sessionId} by ${additionalMinutes} minutes`
      )
      return { success: true }
    } catch (error) {
      console.error('Error extending session:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to extend session',
      }
    }
  }

  async getSessionTTL(
    sessionId: string
  ): Promise<{ success: boolean; ttl?: number; error?: string }> {
    try {
      const sessionKey = this.getSessionKey(sessionId)
      const ttl = await this.redis.ttl(sessionKey)

      return { success: true, ttl: ttl > 0 ? ttl : 0 }
    } catch (error) {
      console.error('Error getting session TTL:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get session TTL',
      }
    }
  }
}

// Singleton instance
let examStorage: RedisExamStorage | null = null

export function getExamStorage(): RedisExamStorage {
  if (!examStorage) {
    examStorage = new RedisExamStorage()
  }
  return examStorage
}

export default RedisExamStorage
