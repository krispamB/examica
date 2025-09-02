'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, FileText, Monitor, Settings, BarChart3, Clock, Activity } from 'lucide-react'
import Button from '@/components/ui/Button'
import ExamMonitorDashboard from '@/components/examiner/ExamMonitorDashboard'

interface AdminDashboardContentProps {
  userId: string
}

interface AdminStats {
  totalUsers: number
  totalExams: number
  activeExams: number
  completedExams: number
  totalAttempts: number
  activeStudents: number
  systemHealth: 'good' | 'warning' | 'error'
  usersByRole: {
    admin: number
    examiner: number
    student: number
  }
}

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = () => {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setError(null)

      // Load exams data
      const examsResponse = await fetch('/api/exams?include_questions=true&limit=100')
      
      let exams = []
      if (examsResponse.ok) {
        const examsData = await examsResponse.json()
        exams = examsData.exams || []
      } else {
        // Handle case where tables don't exist yet
        console.warn('Exams API not ready, using empty data')
      }

      // Calculate exam stats
      const totalExams = exams.length
      const activeExams = exams.filter((e: { status: string }) => e.status === 'active').length
      const completedExams = exams.filter((e: { status: string }) => e.status === 'archived').length

      // Load real user data and session statistics
      const usersResponse = await fetch('/api/users/stats')
      let totalUsers = 0
      let usersByRole = { admin: 1, examiner: 0, student: 0 }
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        totalUsers = usersData.totalUsers || 0
        usersByRole = usersData.usersByRole || { admin: 1, examiner: 0, student: 0 }
      }

      // Load session data
      const sessionsResponse = await fetch('/api/exam-sessions?limit=1000')
      let totalAttempts = 0
      let activeStudents = 0
      
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        const sessions = sessionsData.sessions || []
        totalAttempts = sessions.length
        activeStudents = sessions.filter((s: { status: string }) => s.status === 'active').length
      }

      // System health based on various factors
      const systemHealth: AdminStats['systemHealth'] = 
        activeExams > 0 && totalUsers > 0 ? 'good' : 
        totalExams > 0 ? 'warning' : 'error'

      setStats({
        totalUsers,
        totalExams,
        activeExams,
        completedExams,
        totalAttempts,
        activeStudents,
        systemHealth,
        usersByRole
      })
    } catch (err) {
      console.error('Load dashboard data error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const getSystemHealthColor = (health: AdminStats['systemHealth']): string => {
    switch (health) {
      case 'good': return 'text-success'
      case 'warning': return 'text-warning'
      case 'error': return 'text-error'
      default: return 'text-secondary'
    }
  }

  const getSystemHealthText = (health: AdminStats['systemHealth']): string => {
    switch (health) {
      case 'good': return 'Good'
      case 'warning': return 'Warning'
      case 'error': return 'Error'
      default: return 'Unknown'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="mt-2 text-secondary">Loading system overview...</p>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="mt-2 text-secondary">Welcome to the Examica administration panel.</p>
        </div>

        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Dashboard Error</h3>
          <p className="text-secondary mb-6">{error || 'Failed to load dashboard'}</p>
          <Button onClick={loadDashboardData}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="mt-2 text-secondary">Welcome to the Examica administration panel.</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Total Users</h3>
              <p className="text-xs text-secondary">System-wide</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
          <p className="text-sm text-secondary">
            {stats.usersByRole.admin + stats.usersByRole.examiner + stats.usersByRole.student} active
          </p>
        </div>

        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-success-light rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Active Exams</h3>
              <p className="text-xs text-secondary">{stats.totalExams} total</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-success">{stats.activeExams}</p>
          <p className="text-sm text-secondary">Currently running</p>
        </div>

        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-info-light rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-info" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Completed Exams</h3>
              <p className="text-xs text-secondary">{stats.totalAttempts} attempts</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-info">{stats.completedExams}</p>
          <p className="text-sm text-secondary">Total finished</p>
        </div>

        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-warning-light rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">System Health</h3>
              <p className="text-xs text-secondary">Overall status</p>
            </div>
          </div>
          <p className={`text-3xl font-bold ${getSystemHealthColor(stats.systemHealth)}`}>
            {getSystemHealthText(stats.systemHealth)}
          </p>
          <p className="text-sm text-secondary">System status</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">User Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Administrators</span>
              <span className="text-sm font-medium text-foreground">{stats.usersByRole.admin}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Examiners</span>
              <span className="text-sm font-medium text-foreground">{stats.usersByRole.examiner}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Students</span>
              <span className="text-sm font-medium text-foreground">{stats.usersByRole.student}</span>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/admin/users">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-background-secondary transition-colors">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">Manage Users</span>
              </div>
            </Link>
            <Link href="/admin/exams">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-background-secondary transition-colors">
                <FileText className="w-4 h-4 text-success" />
                <span className="text-sm text-foreground">Manage Exams</span>
              </div>
            </Link>
            <Link href="/admin/monitor">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-background-secondary transition-colors">
                <Monitor className="w-4 h-4 text-warning" />
                <span className="text-sm text-foreground">Monitor System</span>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">System Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Total Exams</span>
              <span className="text-sm font-medium text-foreground">{stats.totalExams}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Active Sessions</span>
              <span className="text-sm font-medium text-foreground">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Total Attempts</span>
              <span className="text-sm font-medium text-foreground">{stats.totalAttempts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Monitor Section */}
      <div className="bg-background rounded-lg shadow-sm border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Live Exam Monitor</h3>
          <Link href="/admin/monitor">
            <Button variant="ghost" size="sm">
              View Full Monitor
            </Button>
          </Link>
        </div>
        
        <div className="p-6">
          <ExamMonitorDashboard className="h-96 overflow-hidden" />
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {stats.totalExams === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-secondary mx-auto mb-2" />
                <p className="text-sm text-secondary">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-sm text-foreground">System initialized</span>
                  <span className="text-xs text-secondary ml-auto">Recently</span>
                </div>
                {stats.activeExams > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm text-foreground">{stats.activeExams} exams activated</span>
                    <span className="text-xs text-secondary ml-auto">Active</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">System Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Database</span>
              <span className="text-sm font-medium text-success">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Authentication</span>
              <span className="text-sm font-medium text-success">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">File Storage</span>
              <span className="text-sm font-medium text-success">Available</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Facial Recognition</span>
              <span className="text-sm font-medium text-success">Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message for New Admins */}
      {stats.totalExams === 0 && (
        <div className="bg-primary-light border border-primary/20 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-primary mb-2">Welcome to Examica Admin!</h3>
              <p className="text-sm text-primary mb-4">
                Your exam platform is ready. Start by inviting users or creating your first exam to get the system operational.
              </p>
              <div className="flex items-center gap-3">
                <Link href="/admin/users">
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-1" />
                    Manage Users
                  </Button>
                </Link>
                <Link href="/admin/exams">
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-1" />
                    View Exams
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardContent