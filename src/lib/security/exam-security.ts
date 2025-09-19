/**
 * Exam Security Service
 *
 * Provides security measures for exam sessions including rate limiting,
 * session validation, audit logging, and anti-cheating measures.
 */

import { createHash } from 'crypto'
import type { Json } from '@/types/database.types'

export interface SecurityEvent {
  type:
    | 'session_start'
    | 'answer_submit'
    | 'suspicious_activity'
    | 'rate_limit'
    | 'session_conflict'
    | 'data_integrity'
  sessionId: string
  userId: string
  timestamp: number
  details: Json
  severity: 'low' | 'medium' | 'high' | 'critical'
  ip?: string
  userAgent?: string
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  blockDurationMs: number
}

export interface SessionValidation {
  isValid: boolean
  issues: string[]
  riskScore: number
  recommendations: string[]
}

export interface SecurityMetrics {
  totalEvents: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  suspiciousActivities: number
  rateLimitViolations: number
  lastActivity: number
}

class ExamSecurityService {
  private readonly rateLimits = new Map<
    string,
    { count: number; resetTime: number; blocked: boolean }
  >()
  private readonly securityEvents: SecurityEvent[] = []
  private readonly sessionMetrics = new Map<string, SecurityMetrics>()

  private readonly DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
    answer_submission: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 answers per minute max
      blockDurationMs: 5 * 60 * 1000, // 5 minutes block
    },
    session_requests: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 session requests per minute
      blockDurationMs: 10 * 60 * 1000, // 10 minutes block
    },
    auto_save: {
      windowMs: 30 * 1000, // 30 seconds
      maxRequests: 5, // 5 auto-saves per 30 seconds
      blockDurationMs: 2 * 60 * 1000, // 2 minutes block
    },
  }

  /**
   * Check rate limits for a specific action
   */
  checkRateLimit(
    identifier: string,
    action: string,
    customConfig?: Partial<RateLimitConfig>
  ): {
    allowed: boolean
    remaining: number
    resetTime: number
    blocked: boolean
  } {
    const config = { ...this.DEFAULT_RATE_LIMITS[action], ...customConfig }
    const key = `${identifier}:${action}`
    const now = Date.now()

    const current = this.rateLimits.get(key) || {
      count: 0,
      resetTime: now + config.windowMs,
      blocked: false,
    }

    // Check if currently blocked
    if (current.blocked) {
      const blockExpiry = current.resetTime + config.blockDurationMs
      if (now < blockExpiry) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: blockExpiry,
          blocked: true,
        }
      } else {
        // Block expired, reset
        current.blocked = false
        current.count = 0
        current.resetTime = now + config.windowMs
      }
    }

    // Reset window if expired
    if (now >= current.resetTime) {
      current.count = 0
      current.resetTime = now + config.windowMs
      current.blocked = false
    }

    // Check if request is allowed
    if (current.count >= config.maxRequests) {
      current.blocked = true
      current.resetTime = now // Start block timer

      this.logSecurityEvent({
        type: 'rate_limit',
        sessionId: identifier.split(':')[0] || identifier,
        userId: identifier.split(':')[1] || 'unknown',
        timestamp: now,
        details: {
          action,
          limit: config.maxRequests,
          window: config.windowMs,
          blockDuration: config.blockDurationMs,
        },
        severity: 'medium',
      })

      this.rateLimits.set(key, current)

      return {
        allowed: false,
        remaining: 0,
        resetTime: now + config.blockDurationMs,
        blocked: true,
      }
    }

    // Allow request and increment counter
    current.count++
    this.rateLimits.set(key, current)

    return {
      allowed: true,
      remaining: config.maxRequests - current.count,
      resetTime: current.resetTime,
      blocked: false,
    }
  }

  /**
   * Validate exam session security
   */
  validateSession(
    _sessionId: string,
    userId: string,
    metadata: Json
  ): SessionValidation {
    const issues: string[] = []
    const recommendations: string[] = []
    let riskScore = 0

    // Check for required metadata
    if (!(metadata as any).userAgent) {
      issues.push('Missing user agent information')
      riskScore += 10
    }

    if (!(metadata as any).timestamp) {
      issues.push('Missing timestamp information')
      riskScore += 5
    }

    // Check for suspicious timing patterns
    if (
      (metadata as any).responseTime &&
      typeof (metadata as any).responseTime === 'number'
    ) {
      if ((metadata as any).responseTime < 1000) {
        // Less than 1 second responses
        issues.push('Unusually fast response times detected')
        riskScore += 15
        recommendations.push('Review response timing patterns')
      }
    }

    // Check for multiple sessions
    const userSessions = this.getActiveSessionsForUser(userId)
    if (userSessions.length > 1) {
      issues.push('Multiple active sessions detected')
      riskScore += 20
      recommendations.push('Ensure only one exam session is active per user')
    }

    // Check session duration
    if (
      (metadata as any).sessionDuration &&
      typeof (metadata as any).sessionDuration === 'number'
    ) {
      const maxDuration = 8 * 60 * 60 * 1000 // 8 hours
      if ((metadata as any).sessionDuration > maxDuration) {
        issues.push('Session duration exceeds maximum allowed time')
        riskScore += 25
        recommendations.push('Review session timeout policies')
      }
    }

    // Check for suspicious patterns in answers
    if (
      (metadata as any).answerPattern &&
      Array.isArray((metadata as any).answerPattern)
    ) {
      const pattern = (metadata as any).answerPattern as string[]
      if (this.detectSuspiciousPattern(pattern)) {
        issues.push('Suspicious answer pattern detected')
        riskScore += 30
        recommendations.push('Manual review recommended')
      }
    }

    // Risk level is determined by riskScore
    // if (riskScore >= 50) riskLevel = 'critical'
    // else if (riskScore >= 30) riskLevel = 'high'
    // else if (riskScore >= 15) riskLevel = 'medium'
    // else riskLevel = 'low'

    return {
      isValid: riskScore < 50,
      issues,
      riskScore,
      recommendations,
    }
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push({
      ...event,
      timestamp: event.timestamp || Date.now(),
    })

    // Update session metrics
    const metrics = this.sessionMetrics.get(event.sessionId) || {
      totalEvents: 0,
      riskLevel: 'low',
      suspiciousActivities: 0,
      rateLimitViolations: 0,
      lastActivity: 0,
    }

    metrics.totalEvents++
    metrics.lastActivity = event.timestamp

    if (event.type === 'suspicious_activity') {
      metrics.suspiciousActivities++
    }

    if (event.type === 'rate_limit') {
      metrics.rateLimitViolations++
    }

    // Update risk level based on events
    if (metrics.suspiciousActivities >= 3 || metrics.rateLimitViolations >= 2) {
      metrics.riskLevel = 'high'
    } else if (
      metrics.suspiciousActivities >= 1 ||
      metrics.rateLimitViolations >= 1
    ) {
      metrics.riskLevel = 'medium'
    }

    this.sessionMetrics.set(event.sessionId, metrics)

    // Auto-alert for critical events
    if (event.severity === 'critical') {
      this.triggerSecurityAlert(event)
    }

    // Cleanup old events (keep only last 1000)
    if (this.securityEvents.length > 1000) {
      this.securityEvents.splice(0, 100)
    }
  }

  /**
   * Generate session security token
   */
  generateSecurityToken(
    sessionId: string,
    userId: string,
    examId: string,
    metadata: Json
  ): string {
    const tokenData = {
      sessionId,
      userId,
      examId,
      timestamp: Date.now(),
      hash: createHash('sha256')
        .update(`${sessionId}:${userId}:${examId}:${JSON.stringify(metadata)}`)
        .digest('hex'),
    }

    return Buffer.from(JSON.stringify(tokenData)).toString('base64')
  }

  /**
   * Validate security token
   */
  validateSecurityToken(
    token: string,
    maxAge: number = 24 * 60 * 60 * 1000 // 24 hours
  ): {
    valid: boolean
    data?: {
      sessionId: string
      userId: string
      examId: string
      timestamp: number
    }
    error?: string
  } {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString())

      if (
        !decoded.sessionId ||
        !decoded.userId ||
        !decoded.examId ||
        !decoded.timestamp
      ) {
        return { valid: false, error: 'Invalid token structure' }
      }

      if (Date.now() - decoded.timestamp > maxAge) {
        return { valid: false, error: 'Token expired' }
      }

      return {
        valid: true,
        data: {
          sessionId: decoded.sessionId,
          userId: decoded.userId,
          examId: decoded.examId,
          timestamp: decoded.timestamp,
        },
      }
    } catch {
      return { valid: false, error: 'Token parsing failed' }
    }
  }

  /**
   * Monitor answer submission patterns
   */
  analyzeAnswerSubmission(
    sessionId: string,
    userId: string,
    questionId: string,
    response: unknown,
    timing: {
      timeOnQuestion: number
      totalTimeElapsed: number
      responseTime: number
    }
  ): {
    suspicious: boolean
    flags: string[]
    riskScore: number
  } {
    const flags: string[] = []
    let riskScore = 0

    // Check response time
    if (timing.responseTime < 500) {
      // Less than 0.5 seconds
      flags.push('Extremely fast response')
      riskScore += 15
    }

    if (timing.timeOnQuestion < 2000) {
      // Less than 2 seconds on question
      flags.push('Insufficient time spent on question')
      riskScore += 10
    }

    // Check for copy-paste patterns (long responses submitted very quickly)
    if (
      typeof response === 'string' &&
      response.length > 100 &&
      timing.responseTime < 5000
    ) {
      flags.push('Possible copy-paste behavior')
      riskScore += 20
    }

    // Log if suspicious
    if (riskScore >= 15) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        sessionId,
        userId,
        timestamp: Date.now(),
        details: {
          questionId,
          flags,
          timing,
          responseLength: typeof response === 'string' ? response.length : 0,
        },
        severity: riskScore >= 25 ? 'high' : 'medium',
      })
    }

    return {
      suspicious: riskScore >= 15,
      flags,
      riskScore,
    }
  }

  /**
   * Get security metrics for a session
   */
  getSessionMetrics(sessionId: string): SecurityMetrics | null {
    return this.sessionMetrics.get(sessionId) || null
  }

  /**
   * Get security events for analysis
   */
  getSecurityEvents(filters?: {
    sessionId?: string
    userId?: string
    type?: SecurityEvent['type']
    severity?: SecurityEvent['severity']
    since?: number
    limit?: number
  }): SecurityEvent[] {
    let events = [...this.securityEvents]

    if (filters) {
      if (filters.sessionId) {
        events = events.filter((e) => e.sessionId === filters.sessionId)
      }
      if (filters.userId) {
        events = events.filter((e) => e.userId === filters.userId)
      }
      if (filters.type) {
        events = events.filter((e) => e.type === filters.type)
      }
      if (filters.severity) {
        events = events.filter((e) => e.severity === filters.severity)
      }
      if (filters.since) {
        events = events.filter((e) => e.timestamp >= filters.since!)
      }
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp - a.timestamp)

    // Apply limit
    if (filters?.limit) {
      events = events.slice(0, filters.limit)
    }

    return events
  }

  /**
   * Clean up old data
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): {
    eventsRemoved: number
    rateLimitsCleared: number
    metricsCleared: number
  } {
    const cutoff = Date.now() - maxAge

    // Clean security events
    const initialEventCount = this.securityEvents.length
    const eventsToKeep = this.securityEvents.filter(
      (e) => e.timestamp >= cutoff
    )
    this.securityEvents.length = 0
    this.securityEvents.push(...eventsToKeep)
    const eventsRemoved = initialEventCount - eventsToKeep.length

    // Clean rate limits
    let rateLimitsCleared = 0
    for (const [key, data] of this.rateLimits.entries()) {
      if (data.resetTime < cutoff) {
        this.rateLimits.delete(key)
        rateLimitsCleared++
      }
    }

    // Clean session metrics
    let metricsCleared = 0
    for (const [sessionId, metrics] of this.sessionMetrics.entries()) {
      if (metrics.lastActivity < cutoff) {
        this.sessionMetrics.delete(sessionId)
        metricsCleared++
      }
    }

    return {
      eventsRemoved,
      rateLimitsCleared,
      metricsCleared,
    }
  }

  private detectSuspiciousPattern(answers: string[]): boolean {
    if (answers.length < 5) return false

    // Check for repetitive patterns
    // const consecutiveCount = new Map<string, number>()
    let maxConsecutive = 0
    let currentAnswer = ''
    let currentCount = 0

    for (const answer of answers) {
      if (answer === currentAnswer) {
        currentCount++
      } else {
        maxConsecutive = Math.max(maxConsecutive, currentCount)
        currentAnswer = answer
        currentCount = 1
      }
    }
    maxConsecutive = Math.max(maxConsecutive, currentCount)

    // Flag if more than 60% of answers are the same
    if (maxConsecutive > answers.length * 0.6) {
      return true
    }

    // Check for ABCD... patterns
    const pattern = answers.slice(0, Math.min(answers.length, 10)).join('')
    const suspiciousPatterns = [
      'ABCABC',
      'ABABAB',
      'AAAAAA',
      'BBBBBB',
      'CCCCCC',
      'DDDDDD',
    ]

    return suspiciousPatterns.some((p) => pattern.includes(p))
  }

  private getActiveSessionsForUser(userId: string): string[] {
    const sessions = new Set<string>()

    // Check recent events for active sessions
    const recentEvents = this.securityEvents.filter(
      (e) => e.userId === userId && e.timestamp > Date.now() - 60 * 60 * 1000 // Last hour
    )

    recentEvents.forEach((event) => {
      sessions.add(event.sessionId)
    })

    return Array.from(sessions)
  }

  private triggerSecurityAlert(event: SecurityEvent): void {
    // In a real implementation, this would send alerts via email, Slack, etc.
    console.warn('SECURITY ALERT:', {
      type: event.type,
      sessionId: event.sessionId,
      userId: event.userId,
      severity: event.severity,
      details: event.details,
    })

    // Could also be integrated with external monitoring services
    if (
      typeof window !== 'undefined' &&
      'navigator' in window &&
      'sendBeacon' in navigator
    ) {
      const alertData = JSON.stringify({
        alert: 'security_event',
        ...event,
      })

      // Send to monitoring endpoint
      navigator.sendBeacon('/api/security/alerts', alertData)
    }
  }
}

// Singleton instance
export const examSecurityService = new ExamSecurityService()
export default examSecurityService
