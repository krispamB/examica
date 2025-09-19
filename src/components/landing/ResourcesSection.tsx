'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  BookOpen,
  HelpCircle,
  Download,
  Phone,
  FileText,
  Video,
  ExternalLink,
  Clock,
  Users,
  Settings,
} from 'lucide-react'

interface ResourcesSectionProps {
  className?: string
}

const ResourcesSection: React.FC<ResourcesSectionProps> = ({ className }) => {
  const resources = [
    {
      icon: BookOpen,
      category: 'Student Guide',
      title: 'How to Take Exams',
      description:
        'Complete guide for students on accessing and taking exams securely',
      type: 'Guide',
      readTime: '5 min read',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Video,
      category: 'Faculty Training',
      title: 'Creating Effective Assessments',
      description:
        'Video tutorial on using AI question generation and exam management',
      type: 'Video',
      readTime: '15 min watch',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: Settings,
      category: 'Administrator',
      title: 'System Configuration',
      description:
        'Technical documentation for setting up and managing the platform',
      type: 'Documentation',
      readTime: '10 min read',
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      icon: Download,
      category: 'Technical',
      title: 'System Requirements',
      description:
        'Hardware and software requirements for optimal platform performance',
      type: 'Download',
      readTime: '2 min read',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      icon: HelpCircle,
      category: 'Support',
      title: 'Frequently Asked Questions',
      description:
        'Common questions and answers about using the examination platform',
      type: 'FAQ',
      readTime: '8 min read',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      icon: FileText,
      category: 'Academic',
      title: 'Examination Policies',
      description:
        'University of Jos policies and procedures for digital examinations',
      type: 'Policy',
      readTime: '12 min read',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ]

  const supportOptions = [
    {
      icon: Phone,
      title: 'Technical Support',
      description: 'Get immediate help during exam sessions',
      contact: '+234 (0) 73 xxx-xxxx',
      availability: '24/7 during exam periods',
      color: 'text-error',
      bgColor: 'bg-error/10',
    },
    {
      icon: Users,
      title: 'Academic Support',
      description: 'Assistance with academic policies and procedures',
      contact: 'academic.support@unijos.edu.ng',
      availability: 'Mon-Fri, 8AM-5PM',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: Settings,
      title: 'IT Services',
      description: 'Platform administration and technical issues',
      contact: 'it.services@unijos.edu.ng',
      availability: 'Mon-Fri, 8AM-6PM',
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ]

  return (
    <section
      id="resources"
      className={cn('py-20 sm:py-24 bg-background-secondary', className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Resources & <span className="text-gradient">Support</span>
          </h2>
          <p className="text-lg text-secondary max-w-3xl mx-auto">
            Everything you need to successfully use the University of Jos
            examination platform. From student guides to technical
            documentation, we&apos;ve got you covered.
          </p>
        </div>

        {/* Resources Grid */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            Knowledge Base
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <Card
                key={index}
                className="card-hover border-0 shadow-md bg-background group cursor-pointer"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn('p-2 rounded-lg', resource.bgColor)}>
                      <resource.icon
                        className={cn('w-6 h-6', resource.color)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={cn(
                          'text-xs font-medium px-2 py-1 rounded-full',
                          resource.bgColor,
                          resource.color
                        )}
                      >
                        {resource.type}
                      </span>
                      <ExternalLink className="w-4 h-4 text-secondary group-hover:text-primary transition-colors" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    <p className="text-xs text-secondary font-medium mb-1">
                      {resource.category}
                    </p>
                    <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
                      {resource.title}
                    </h4>
                    <p className="text-sm text-secondary leading-relaxed line-clamp-3">
                      {resource.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-secondary">
                      <Clock className="w-3 h-3" />
                      <span>{resource.readTime}</span>
                    </div>
                    <Link href="#resources">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Read More
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            Get Support
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {supportOptions.map((option, index) => (
              <Card
                key={index}
                className="border-0 shadow-md bg-background text-center"
              >
                <div className="p-6">
                  <div
                    className={cn(
                      'p-4 rounded-full inline-flex mb-4',
                      option.bgColor
                    )}
                  >
                    <option.icon className={cn('w-8 h-8', option.color)} />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    {option.title}
                  </h4>
                  <p className="text-sm text-secondary mb-4 leading-relaxed">
                    {option.description}
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {option.contact}
                    </p>
                    <p className="text-xs text-secondary">
                      {option.availability}
                    </p>
                  </div>
                  <Link href="mailto:examica@unijos.edu.ng">
                    <Button variant="outline" size="sm" className="mt-4 w-full">
                      Contact Support
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg border border-border p-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Quick Access
            </h3>
            <p className="text-secondary">
              Direct links to commonly used resources and portals
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Student Portal', href: '/student' },
              { label: 'Faculty Portal', href: '/examiner' },
              { label: 'Admin Console', href: '/admin' },
              { label: 'IT Helpdesk', href: 'tel:+234073xxxxxxx' },
            ].map((link, index) => (
              <Link key={index} href={link.href}>
                <Button
                  variant="ghost"
                  className="h-auto py-4 flex-col space-y-1 w-full"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span className="text-sm">{link.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-12 text-center bg-error/5 border border-error/20 rounded-lg p-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Phone className="w-5 h-5 text-error" />
            <h4 className="font-semibold text-error">Emergency Exam Support</h4>
          </div>
          <p className="text-sm text-secondary mb-3">
            For urgent technical issues during active exam sessions
          </p>
          <Link href="tel:+234073xxxxxxx">
            <p className="font-bold text-error text-lg hover:underline cursor-pointer">
              +234 (0) 73 xxx-xxxx
            </p>
          </Link>
          <p className="text-xs text-secondary mt-1">
            Available 24/7 during examination periods
          </p>
        </div>
      </div>
    </section>
  )
}

export default ResourcesSection
