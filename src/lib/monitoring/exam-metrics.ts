/**
 * Exam Metrics and Monitoring Service
 *
 * Tracks performance metrics, system health, and user behavior analytics
 * for the exam system optimization and monitoring.
 */

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
  sessionId?: string
  userId?: string
  metadata?: Record<string, unknown>
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number
  metrics: {
    responseTime: number
    errorRate: number
    throughput: number
    activeUsers: number
    activeSessions: number
  }
  issues: string[]
  lastCheck: number
}

export interface UserBehaviorMetric {
  userId: string
  sessionId: string
  event: string
  timestamp: number
  duration?: number
  metadata: Record<string, unknown>
}

export interface ExamAnalytics {
  examId: string
  metrics: {
    totalAttempts: number
    completionRate: number
    averageScore: number
    averageDuration: number
    abandonmentRate: number
  }
  performance: {
    averageResponseTime: number
    errorRate: number
    syncSuccessRate: number
  }
  patterns: {
    peakUsageHours: number[]
    commonIssues: string[]
    difficultyDistribution: Record<string, number>
  }
  lastUpdated: number
}

class ExamMetricsService {
  private readonly metrics: PerformanceMetric[] = []
  private readonly behaviorMetrics: UserBehaviorMetric[] = []
  private readonly systemHealth: SystemHealth = {
    status: 'healthy',
    uptime: Date.now(),
    metrics: {
      responseTime: 0,
      errorRate: 0,
      throughput: 0,
      activeUsers: 0,
      activeSessions: 0,
    },
    issues: [],
    lastCheck: Date.now(),
  }

  private readonly performanceBuffer = new Map<string, number[]>()
  private readonly MAX_METRICS_HISTORY = 1000
  private readonly HEALTH_CHECK_INTERVAL = 30000 // 30 seconds

  constructor() {
    this.startHealthMonitoring()
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    sessionId?: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      sessionId,
      userId,
      metadata,
    }

    this.metrics.push(metric)

    // Update performance buffer for trending
    const buffer = this.performanceBuffer.get(name) || []
    buffer.push(value)
    if (buffer.length > 50) {
      // Keep last 50 measurements
      buffer.shift()
    }
    this.performanceBuffer.set(name, buffer)

    // Cleanup old metrics
    if (this.metrics.length > this.MAX_METRICS_HISTORY) {
      this.metrics.splice(0, 100)
    }

    // Check for performance alerts
    this.checkPerformanceAlerts(name, value)
  }

  /**
   * Record user behavior event
   */
  recordUserBehavior(
    userId: string,
    sessionId: string,
    event: string,
    duration?: number,
    metadata: Record<string, unknown> = {}
  ): void {
    const behaviorMetric: UserBehaviorMetric = {
      userId,
      sessionId,
      event,
      timestamp: Date.now(),
      duration,
      metadata,
    }

    this.behaviorMetrics.push(behaviorMetric)

    // Cleanup old behavior metrics
    if (this.behaviorMetrics.length > this.MAX_METRICS_HISTORY) {
      this.behaviorMetrics.splice(0, 100)
    }

    // Update system health metrics
    // this.updateSystemMetrics() // TODO: Implement this method
  }

  /**
   * Track exam session performance
   */
  trackExamSession(
    sessionId: string,
    userId: string,
    examId: string,
    event: 'start' | 'answer' | 'save' | 'sync' | 'complete' | 'error',
    metadata: Record<string, unknown> = {}
  ): void {
    const duration = metadata.duration as number | undefined

    this.recordUserBehavior(userId, sessionId, `exam_${event}`, duration, {
      ...metadata,
      examId,
    })

    // Record specific performance metrics
    switch (event) {
      case 'save':
        this.recordMetric(
          'local_save_time',
          duration || 0,
          'ms',
          sessionId,
          userId
        )
        break
      case 'sync':
        this.recordMetric('sync_time', duration || 0, 'ms', sessionId, userId)
        break
      case 'answer':
        this.recordMetric(
          'answer_response_time',
          duration || 0,
          'ms',
          sessionId,
          userId
        )
        break
    }
  }

  /**
   * Track API performance
   */
  trackAPICall(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    sessionId?: string,
    userId?: string
  ): void {
    this.recordMetric(
      `api_${method}_${endpoint}`,
      responseTime,
      'ms',
      sessionId,
      userId,
      {
        statusCode,
        endpoint,
        method,
      }
    )

    // Update error rate
    if (statusCode >= 400) {
      this.recordMetric('api_error_count', 1, 'count', sessionId, userId, {
        statusCode,
        endpoint,
        method,
      })
    }

    // Update system health
    const buffer = this.performanceBuffer.get('api_response_time') || []
    buffer.push(responseTime)
    if (buffer.length > 100) buffer.shift()
    this.performanceBuffer.set('api_response_time', buffer)
  }

  /**
   * Get current system health
   */
  getSystemHealth(): SystemHealth {
    return { ...this.systemHealth }
  }

  /**
   * Get performance metrics
   */
  getMetrics(filters?: {
    name?: string
    sessionId?: string
    userId?: string
    since?: number
    limit?: number
  }): PerformanceMetric[] {
    let results = [...this.metrics]

    if (filters) {
      if (filters.name) {
        results = results.filter((m) => m.name.includes(filters.name!))
      }
      if (filters.sessionId) {
        results = results.filter((m) => m.sessionId === filters.sessionId)
      }
      if (filters.userId) {
        results = results.filter((m) => m.userId === filters.userId)
      }
      if (filters.since) {
        results = results.filter((m) => m.timestamp >= filters.since!)
      }
      if (filters.limit) {
        results = results.slice(-filters.limit)
      }
    }

    return results.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get user behavior analytics
   */
  getUserBehaviorAnalytics(
    userId?: string,
    sessionId?: string,
    since?: number
  ): {
    events: UserBehaviorMetric[]
    summary: {
      totalEvents: number
      sessionDuration: number
      commonEvents: Array<{ event: string; count: number }>
      averageResponseTime: number
    }
  } {
    let events = [...this.behaviorMetrics]

    if (userId) {
      events = events.filter((e) => e.userId === userId)
    }
    if (sessionId) {
      events = events.filter((e) => e.sessionId === sessionId)
    }
    if (since) {
      events = events.filter((e) => e.timestamp >= since)
    }

    // Calculate summary statistics
    const eventCounts = new Map<string, number>()
    let totalDuration = 0
    let responseTimeSum = 0
    let responseTimeCount = 0

    events.forEach((event) => {
      eventCounts.set(event.event, (eventCounts.get(event.event) || 0) + 1)

      if (event.duration) {
        totalDuration += event.duration
        if (
          event.event.includes('response') ||
          event.event.includes('answer')
        ) {
          responseTimeSum += event.duration
          responseTimeCount++
        }
      }
    })

    const commonEvents = Array.from(eventCounts.entries())
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      events: events.sort((a, b) => b.timestamp - a.timestamp),
      summary: {
        totalEvents: events.length,
        sessionDuration: totalDuration,
        commonEvents,
        averageResponseTime:
          responseTimeCount > 0 ? responseTimeSum / responseTimeCount : 0,
      },
    }
  }

  /**
   * Generate exam analytics
   */
  generateExamAnalytics(examId: string): ExamAnalytics {
    const examEvents = this.behaviorMetrics.filter(
      (e) => e.metadata.examId === examId
    )

    const _sessions = new Set(examEvents.map((e) => e.sessionId))
    const _users = new Set(examEvents.map((e) => e.userId))

    // Calculate metrics
    const startEvents = examEvents.filter((e) => e.event === 'exam_start')
    const completeEvents = examEvents.filter((e) => e.event === 'exam_complete')
    const totalAttempts = startEvents.length
    const completionRate =
      totalAttempts > 0 ? (completeEvents.length / totalAttempts) * 100 : 0

    // Get performance metrics for this exam
    const examMetrics = this.metrics.filter(
      (m) => m.metadata?.examId === examId
    )

    const responseTimes = examMetrics
      .filter((m) => m.name.includes('response_time'))
      .map((m) => m.value)

    const _syncTimes = examMetrics
      .filter((m) => m.name.includes('sync_time'))
      .map((m) => m.value)

    const errors = examMetrics.filter((m) => m.name.includes('error')).length

    // Calculate patterns
    const hourlyUsage = new Array(24).fill(0)
    examEvents.forEach((event) => {
      const hour = new Date(event.timestamp).getHours()
      hourlyUsage[hour]++
    })

    const peakUsageHours = hourlyUsage
      .map((usage, hour) => ({ hour, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 3)
      .map((h) => h.hour)

    const commonIssues: string[] = []
    if (errors > totalAttempts * 0.1) {
      commonIssues.push('High error rate detected')
    }
    if (
      responseTimes.length > 0 &&
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length > 5000
    ) {
      commonIssues.push('Slow response times')
    }

    return {
      examId,
      metrics: {
        totalAttempts,
        completionRate: Math.round(completionRate * 100) / 100,
        averageScore: 0, // Would be calculated from actual scores
        averageDuration: this.calculateAverageDuration(examEvents),
        abandonmentRate: Math.round((100 - completionRate) * 100) / 100,
      },
      performance: {
        averageResponseTime:
          responseTimes.length > 0
            ? Math.round(
                responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
              )
            : 0,
        errorRate:
          totalAttempts > 0
            ? Math.round((errors / totalAttempts) * 10000) / 100
            : 0,
        syncSuccessRate: this.calculateSyncSuccessRate(examMetrics),
      },
      patterns: {
        peakUsageHours,
        commonIssues,
        difficultyDistribution: {}, // Would be calculated from question analytics
      },
      lastUpdated: Date.now(),
    }
  }

  /**
   * Get real-time dashboard data
   */
  getDashboardData(): {
    currentUsers: number
    activeSessions: number
    systemHealth: SystemHealth
    recentMetrics: {
      responseTime: number
      errorRate: number
      syncSuccessRate: number
    }
    alerts: Array<{
      type: 'performance' | 'error' | 'capacity'
      message: string
      severity: 'low' | 'medium' | 'high'
      timestamp: number
    }>
  } {
    const now = Date.now()
    const recentWindow = 5 * 60 * 1000 // 5 minutes

    const recentEvents = this.behaviorMetrics.filter(
      (e) => e.timestamp > now - recentWindow
    )

    const currentUsers = new Set(recentEvents.map((e) => e.userId)).size

    const activeSessions = new Set(recentEvents.map((e) => e.sessionId)).size

    const recentMetrics = this.metrics.filter(
      (m) => m.timestamp > now - recentWindow
    )

    const responseTimeMetrics = recentMetrics
      .filter((m) => m.name.includes('response_time'))
      .map((m) => m.value)

    const errorCount = recentMetrics.filter((m) =>
      m.name.includes('error')
    ).length

    const syncMetrics = recentMetrics.filter((m) => m.name.includes('sync'))

    const alerts = this.generateAlerts()

    return {
      currentUsers,
      activeSessions,
      systemHealth: this.getSystemHealth(),
      recentMetrics: {
        responseTime:
          responseTimeMetrics.length > 0
            ? Math.round(
                responseTimeMetrics.reduce((a, b) => a + b, 0) /
                  responseTimeMetrics.length
              )
            : 0,
        errorRate:
          recentEvents.length > 0
            ? Math.round((errorCount / recentEvents.length) * 10000) / 100
            : 0,
        syncSuccessRate: this.calculateSyncSuccessRate(syncMetrics),
      },
      alerts,
    }
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      this.updateSystemHealth()
    }, this.HEALTH_CHECK_INTERVAL)
  }

  private updateSystemHealth(): void {
    const now = Date.now()
    const recentWindow = 5 * 60 * 1000 // 5 minutes

    const recentMetrics = this.metrics.filter(
      (m) => m.timestamp > now - recentWindow
    )

    const recentBehavior = this.behaviorMetrics.filter(
      (e) => e.timestamp > now - recentWindow
    )

    // Calculate metrics
    const responseTimes = recentMetrics
      .filter((m) => m.name.includes('response_time'))
      .map((m) => m.value)

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0

    const errorCount = recentMetrics.filter((m) =>
      m.name.includes('error')
    ).length

    const errorRate =
      recentBehavior.length > 0 ? (errorCount / recentBehavior.length) * 100 : 0

    const activeUsers = new Set(recentBehavior.map((e) => e.userId)).size
    const activeSessions = new Set(recentBehavior.map((e) => e.sessionId)).size

    // Update health status
    const issues: string[] = []
    let status: SystemHealth['status'] = 'healthy'

    if (avgResponseTime > 5000) {
      issues.push('High response times detected')
      status = 'degraded'
    }

    if (errorRate > 5) {
      issues.push('High error rate detected')
      status = status === 'healthy' ? 'degraded' : 'unhealthy'
    }

    if (avgResponseTime > 10000 || errorRate > 10) {
      status = 'unhealthy'
    }

    this.systemHealth.status = status
    this.systemHealth.metrics = {
      responseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      throughput: Math.round(recentBehavior.length / 5), // Events per minute
      activeUsers,
      activeSessions,
    }
    this.systemHealth.issues = issues
    this.systemHealth.lastCheck = now
  }

  private checkPerformanceAlerts(name: string, value: number): void {
    const thresholds: Record<
      string,
      { warning: number; critical: number; unit: string }
    > = {
      api_response_time: { warning: 3000, critical: 5000, unit: 'ms' },
      sync_time: { warning: 10000, critical: 20000, unit: 'ms' },
      local_save_time: { warning: 1000, critical: 2000, unit: 'ms' },
      answer_response_time: { warning: 30000, critical: 60000, unit: 'ms' },
    }

    const threshold = thresholds[name]
    if (!threshold) return

    if (value >= threshold.critical) {
      console.warn(
        `CRITICAL: ${name} exceeded threshold: ${value}${threshold.unit} >= ${threshold.critical}${threshold.unit}`
      )
    } else if (value >= threshold.warning) {
      console.warn(
        `WARNING: ${name} approaching threshold: ${value}${threshold.unit} >= ${threshold.warning}${threshold.unit}`
      )
    }
  }

  private calculateAverageDuration(events: UserBehaviorMetric[]): number {
    const sessionDurations = new Map<string, { start: number; end: number }>()

    events.forEach((event) => {
      if (!sessionDurations.has(event.sessionId)) {
        sessionDurations.set(event.sessionId, {
          start: event.timestamp,
          end: event.timestamp,
        })
      } else {
        const duration = sessionDurations.get(event.sessionId)!
        duration.end = Math.max(duration.end, event.timestamp)
      }
    })

    const durations = Array.from(sessionDurations.values())
      .map((d) => d.end - d.start)
      .filter((d) => d > 0)

    return durations.length > 0
      ? Math.round(
          durations.reduce((a, b) => a + b, 0) / durations.length / 1000
        ) // Convert to seconds
      : 0
  }

  private calculateSyncSuccessRate(syncMetrics: PerformanceMetric[]): number {
    if (syncMetrics.length === 0) return 100

    const successfulSyncs = syncMetrics.filter(
      (m) => m.metadata?.statusCode && (m.metadata.statusCode as number) < 400
    ).length

    return Math.round((successfulSyncs / syncMetrics.length) * 10000) / 100
  }

  private generateAlerts(): Array<{
    type: 'performance' | 'error' | 'capacity'
    message: string
    severity: 'low' | 'medium' | 'high'
    timestamp: number
  }> {
    const alerts = []
    const health = this.systemHealth

    if (health.metrics.responseTime > 5000) {
      alerts.push({
        type: 'performance' as const,
        message: `High response time: ${health.metrics.responseTime}ms`,
        severity:
          health.metrics.responseTime > 10000
            ? ('high' as const)
            : ('medium' as const),
        timestamp: Date.now(),
      })
    }

    if (health.metrics.errorRate > 5) {
      alerts.push({
        type: 'error' as const,
        message: `High error rate: ${health.metrics.errorRate}%`,
        severity:
          health.metrics.errorRate > 10
            ? ('high' as const)
            : ('medium' as const),
        timestamp: Date.now(),
      })
    }

    if (health.metrics.activeUsers > 1000) {
      alerts.push({
        type: 'capacity' as const,
        message: `High user load: ${health.metrics.activeUsers} active users`,
        severity: 'medium' as const,
        timestamp: Date.now(),
      })
    }

    return alerts
  }
}

// Singleton instance
export const examMetricsService = new ExamMetricsService()
export default examMetricsService
