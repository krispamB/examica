'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Shield, Eye, Lock, Award, CheckCircle, Users } from 'lucide-react'

interface AcademicIntegritySectionProps {
  className?: string
}

const AcademicIntegritySection: React.FC<AcademicIntegritySectionProps> = ({
  className,
}) => {
  const securityFeatures = [
    {
      icon: Shield,
      title: 'Facial Recognition',
      description:
        'Advanced biometric verification ensures only authorized students access exams',
    },
    {
      icon: Eye,
      title: 'Real-time Monitoring',
      description:
        'Continuous surveillance during exams maintains examination standards',
    },
    {
      icon: Lock,
      title: 'Secure Environment',
      description:
        'Encrypted connections and secure servers protect examination data',
    },
    {
      icon: Award,
      title: 'Academic Standards',
      description:
        'Maintains the highest standards of academic integrity and fairness',
    },
  ]

  const stats = [
    {
      icon: CheckCircle,
      value: '99.8%',
      label: 'Security Success Rate',
      description: 'Verified authentic examinations',
    },
    {
      icon: Users,
      value: '15,000+',
      label: 'Students Protected',
      description: 'Secure examination sessions',
    },
    {
      icon: Shield,
      value: '0',
      label: 'Security Breaches',
      description: 'Zero incidents since launch',
    },
  ]

  return (
    <section
      className={cn(
        'py-20 sm:py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-3 bg-white/10 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-300 bg-blue-500/20 px-4 py-2 rounded-full">
              Academic Integrity
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            University of Jos Commitment to{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Fair Testing
            </span>
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Our advanced security measures ensure that every examination
            maintains the highest standards of academic integrity, protecting
            the value of University of Jos degrees.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
          {/* Security Features */}
          <div>
            <h3 className="text-2xl font-bold mb-8">
              Advanced Security Measures
            </h3>
            <div className="space-y-6">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="p-2 bg-white/10 rounded-lg flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-gray-300 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link href="#resources">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  Learn More About Security
                </Button>
              </Link>
            </div>
          </div>

          {/* Testimonial/Quote Card */}
          <div className="relative">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    University of Jos
                  </h4>
                  <p className="text-gray-300 text-sm">Academic Excellence</p>
                </div>
              </div>

              <blockquote className="text-lg text-gray-200 leading-relaxed mb-6">
                &ldquo;The implementation of Examica has revolutionized our
                examination process. We now have complete confidence in the
                integrity of our assessments, ensuring that every degree awarded
                truly reflects student achievement.&rdquo;
              </blockquote>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Dr. Godwin Thomas</p>
                  <p className="text-gray-400 text-sm">
                    HOD, Computer Science Department
                  </p>
                </div>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-blue-400 rounded-full" />
                  ))}
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/20 rounded-full blur-xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl" />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-white/10 rounded-full">
                  <stat.icon className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <h4 className="font-semibold text-blue-300 mb-1">{stat.label}</h4>
              <p className="text-gray-400 text-sm">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-300 mb-6">
            Ready to experience secure, reliable examinations?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/student/exams">
              <Button variant="primary" size="lg">
                Start Your Exam
              </Button>
            </Link>
            <Link href="#support">
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                Contact IT Support
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.02] to-transparent" />
        </div>
      </div>
    </section>
  )
}

export default AcademicIntegritySection
