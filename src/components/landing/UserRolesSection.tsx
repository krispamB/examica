'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import {
  GraduationCap,
  Users,
  Settings,
  ChevronRight,
  BookOpen,
  BarChart3,
  Shield,
} from 'lucide-react'

interface UserRolesSectionProps {
  className?: string
}

const UserRolesSection: React.FC<UserRolesSectionProps> = ({ className }) => {
  const [selectedRole, setSelectedRole] = useState('students')

  const roles = [
    {
      id: 'students',
      title: 'Students',
      subtitle: 'Take Your Exams Securely',
      icon: GraduationCap,
      color: 'text-primary',
      bgColor: 'bg-primary',
      lightBg: 'bg-primary/10',
      description:
        'Access your scheduled exams, view results, and track your academic progress with our secure examination platform.',
      features: [
        'Secure facial authentication',
        'Real-time exam progress tracking',
        'Instant result notifications',
        'Mobile-friendly interface',
        'Technical support during exams',
      ],
      stats: [
        { label: 'Average Session', value: '90 min' },
        { label: 'Success Rate', value: '98.5%' },
        { label: 'Students Served', value: '15,000+' },
      ],
    },
    {
      id: 'faculty',
      title: 'Faculty',
      subtitle: 'Create and Manage Assessments',
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success',
      lightBg: 'bg-success/10',
      description:
        'Design comprehensive exams, generate AI-powered questions, and analyze student performance with advanced analytics.',
      features: [
        'AI-powered question generation',
        'Question bank management',
        'Exam scheduling and monitoring',
        'Detailed performance analytics',
        'Grade export and reporting',
      ],
      stats: [
        { label: 'Questions Generated', value: '50,000+' },
        { label: 'Time Saved', value: '75%' },
        { label: 'Faculty Users', value: '500+' },
      ],
    },
    {
      id: 'administrators',
      title: 'Administrators',
      subtitle: 'Monitor and Analyze Performance',
      icon: Settings,
      color: 'text-info',
      bgColor: 'bg-info',
      lightBg: 'bg-info/10',
      description:
        'Oversee university-wide examination processes, manage user access, and gain insights into institutional performance.',
      features: [
        'University-wide analytics dashboard',
        'User management and permissions',
        'Exam security monitoring',
        'System performance tracking',
        'Compliance reporting',
      ],
      stats: [
        { label: 'Departments', value: '25+' },
        { label: 'Uptime', value: '99.9%' },
        { label: 'Data Security', value: 'Enterprise' },
      ],
    },
  ]

  const currentRole = roles.find((role) => role.id === selectedRole) || roles[0]

  return (
    <section className={cn('py-20 sm:py-24 bg-background', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Who Uses the <span className="text-gradient">Platform</span>
          </h2>
          <p className="text-lg text-secondary max-w-3xl mx-auto">
            Our comprehensive platform serves the entire University of Jos
            community, providing tailored experiences for students, faculty, and
            administrators.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="flex flex-col sm:flex-row justify-center mb-12 space-y-2 sm:space-y-0 sm:space-x-2 bg-gray-100 rounded-lg p-2 max-w-2xl mx-auto">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={cn(
                'flex items-center justify-center space-x-2 px-6 py-3 rounded-md font-medium transition-all duration-200 flex-1',
                selectedRole === role.id
                  ? cn(role.bgColor, 'text-white shadow-md')
                  : 'text-secondary hover:text-foreground hover:bg-white'
              )}
            >
              <role.icon className="w-5 h-5" />
              <span>{role.title}</span>
            </button>
          ))}
        </div>

        {/* Selected Role Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Role Information */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className={cn('p-3 rounded-lg', currentRole.lightBg)}>
                <currentRole.icon
                  className={cn('w-8 h-8', currentRole.color)}
                />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {currentRole.title}
                </h3>
                <p className={cn('text-lg font-medium', currentRole.color)}>
                  {currentRole.subtitle}
                </p>
              </div>
            </div>

            <p className="text-secondary text-lg leading-relaxed mb-8">
              {currentRole.description}
            </p>

            {/* Features List */}
            <div className="space-y-3 mb-8">
              {currentRole.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <ChevronRight className={cn('w-5 h-5', currentRole.color)} />
                  <span className="text-secondary">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Link
              href={
                selectedRole === 'students'
                  ? '/student'
                  : selectedRole === 'faculty'
                    ? '/examiner'
                    : '/admin'
              }
            >
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Access {currentRole.title} Portal
              </Button>
            </Link>
          </div>

          {/* Visual Content */}
          <div className="relative">
            {/* Main Card */}
            <Card className="border-0 shadow-xl bg-white">
              <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={cn('p-2 rounded-lg', currentRole.lightBg)}>
                      {selectedRole === 'students' && (
                        <BookOpen
                          className={cn('w-6 h-6', currentRole.color)}
                        />
                      )}
                      {selectedRole === 'faculty' && (
                        <BarChart3
                          className={cn('w-6 h-6', currentRole.color)}
                        />
                      )}
                      {selectedRole === 'administrators' && (
                        <Shield className={cn('w-6 h-6', currentRole.color)} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {selectedRole === 'students' && 'Student Dashboard'}
                        {selectedRole === 'faculty' && 'Faculty Analytics'}
                        {selectedRole === 'administrators' && 'Admin Console'}
                      </h4>
                      <p className="text-sm text-secondary">
                        University of Jos
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-success font-medium">
                    ● Active
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {currentRole.stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div
                        className={cn('text-xl font-bold', currentRole.color)}
                      >
                        {stat.value}
                      </div>
                      <div className="text-xs text-secondary">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Mock Interface */}
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedRole === 'students' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">
                          Upcoming Exams
                        </span>
                        <span className="text-xs text-secondary">
                          3 scheduled
                        </span>
                      </div>
                      <div className="space-y-2">
                        {[
                          'Computer Science 301',
                          'Mathematics 205',
                          'Physics 102',
                        ].map((exam, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center py-2 px-3 bg-white rounded border"
                          >
                            <span className="text-sm text-foreground">
                              {exam}
                            </span>
                            <span className="text-xs text-secondary">
                              Tomorrow
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRole === 'faculty' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">
                          Recent Exams
                        </span>
                        <span className="text-xs text-secondary">
                          Last 7 days
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded p-3 text-center">
                          <div className="text-lg font-bold text-success">
                            85%
                          </div>
                          <div className="text-xs text-secondary">
                            Avg Score
                          </div>
                        </div>
                        <div className="bg-white rounded p-3 text-center">
                          <div className="text-lg font-bold text-primary">
                            247
                          </div>
                          <div className="text-xs text-secondary">Students</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRole === 'administrators' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">
                          System Overview
                        </span>
                        <span className="text-xs text-secondary">Live</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded p-3 text-center">
                          <div className="text-lg font-bold text-info">
                            1,247
                          </div>
                          <div className="text-xs text-secondary">
                            Active Users
                          </div>
                        </div>
                        <div className="bg-white rounded p-3 text-center">
                          <div className="text-lg font-bold text-success">
                            99.9%
                          </div>
                          <div className="text-xs text-secondary">Uptime</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Decorative Elements */}
            <div
              className={cn(
                'absolute -top-4 -right-4 w-8 h-8 rounded-full blur-xl opacity-60',
                currentRole.lightBg
              )}
            />
            <div
              className={cn(
                'absolute -bottom-4 -left-4 w-12 h-12 rounded-full blur-xl opacity-40',
                currentRole.lightBg
              )}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default UserRolesSection
