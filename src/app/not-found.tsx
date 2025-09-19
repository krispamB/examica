'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Logo from '@/components/common/Logo'
import {
  Home,
  ArrowLeft,
  GraduationCap,
  Users,
  Settings,
  Construction,
  Clock,
  Mail,
} from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-light/20 flex flex-col">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col">
                <Logo size="sm" className="items-start" />
                <span className="text-xs text-secondary font-medium">
                  University of Jos
                </span>
              </div>
            </div>
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon and Status */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="p-4 bg-warning/10 rounded-full">
              <Construction className="w-12 h-12 text-warning" />
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Clock className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Feature <span className="text-gradient">Coming Soon</span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-secondary leading-relaxed mb-8 max-w-2xl mx-auto">
            The page you&apos;re looking for is currently under development as
            part of our ongoing platform enhancement. The University of Jos
            examination system is continuously evolving to better serve our
            academic community.
          </p>

          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-border p-8 mb-12 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-2 bg-info/10 rounded-lg">
                <Settings className="w-6 h-6 text-info" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Development in Progress
              </h2>
            </div>

            <p className="text-secondary mb-6">
              Our technical team is working diligently to deliver new features
              and improvements to enhance your examination experience. Thank you
              for your patience as we build a more comprehensive platform.
            </p>

            <div className="flex items-center justify-center space-x-2 text-sm text-secondary">
              <Clock className="w-4 h-4 text-primary" />
              <span>
                Expected updates will be announced through official channels
              </span>
            </div>
          </div>

          {/* Quick Access Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
            {[
              {
                icon: GraduationCap,
                title: 'Student Portal',
                description: 'Access your exams and results',
                href: '/student',
                color: 'text-primary',
                bgColor: 'bg-primary/10',
              },
              {
                icon: Users,
                title: 'Faculty Portal',
                description: 'Manage exams and assessments',
                href: '/examiner',
                color: 'text-success',
                bgColor: 'bg-success/10',
              },
              {
                icon: Settings,
                title: 'Admin Console',
                description: 'System administration',
                href: '/admin',
                color: 'text-info',
                bgColor: 'bg-info/10',
              },
            ].map((portal, index) => (
              <Link key={index} href={portal.href}>
                <div className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-all duration-200 cursor-pointer group">
                  <div
                    className={cn(
                      'p-3 rounded-full mb-4 mx-auto w-fit',
                      portal.bgColor
                    )}
                  >
                    <portal.icon className={cn('w-6 h-6', portal.color)} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-sm text-secondary">{portal.description}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Navigation Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/">
              <Button
                variant="primary"
                size="lg"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Return to Homepage</span>
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="flex items-center space-x-2"
              >
                <Users className="w-5 h-5" />
                <span>Login to Portal</span>
              </Button>
            </Link>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg border border-border p-6 max-w-xl mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                Need Assistance?
              </h3>
            </div>
            <p className="text-sm text-secondary mb-4">
              For questions about upcoming features or technical support, please
              contact our IT services team.
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-foreground font-medium">
                Email:{' '}
                <a
                  href="mailto:examica@unijos.edu.ng"
                  className="text-primary hover:underline"
                >
                  examica@unijos.edu.ng
                </a>
              </p>
              <p className="text-secondary">
                IT Support: Monday - Friday, 8:00 AM - 6:00 PM
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background-secondary border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-secondary text-sm">
            © {new Date().getFullYear()} University of Jos. All rights
            reserved.
          </p>
          <p className="text-secondary text-xs mt-1">
            Examica - Computer-Based Testing Platform
          </p>
        </div>
      </footer>

      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-info/5 rounded-full blur-3xl" />
      </div>
    </div>
  )
}
