'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { BookOpen, Shield, Users } from 'lucide-react'

interface HeroSectionProps {
  className?: string
}

const HeroSection: React.FC<HeroSectionProps> = ({ className }) => {
  return (
    <section
      id="home"
      className={cn(
        'relative bg-gradient-to-br from-background via-background to-primary-light/20 py-20 sm:py-24 lg:py-32',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Secure Digital <span className="text-gradient">Examinations</span>
              <br />
              for University of Jos
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-secondary leading-relaxed">
              Experience the future of academic assessment with our AI-enhanced
              testing platform. Ensuring academic integrity through advanced
              facial recognition and secure examination environments.
            </p>

            {/* Stats */}
            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-6 text-sm">
              <div className="flex items-center space-x-2 text-secondary">
                <Shield className="w-5 h-5 text-success" />
                <span>Secure Authentication</span>
              </div>
              <div className="flex items-center space-x-2 text-secondary">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>AI-Powered Questions</span>
              </div>
              <div className="flex items-center space-x-2 text-secondary">
                <Users className="w-5 h-5 text-info" />
                <span>Real-time Monitoring</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/student/exams">
                <Button
                  variant="primary"
                  size="lg"
                  className="text-base px-8 py-3"
                >
                  Access Your Exams
                </Button>
              </Link>
              <Link href="/examiner">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base px-8 py-3"
                >
                  Faculty Portal
                </Button>
              </Link>
            </div>

            {/* Trust indicator */}
            <div className="mt-8 text-sm text-secondary">
              <p>
                Trusted by{' '}
                <span className="font-semibold text-foreground">
                  University of Jos
                </span>{' '}
                faculty and students
              </p>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative lg:order-2">
            <div className="relative">
              {/* Background decoration */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-info/20 rounded-2xl blur-xl opacity-50" />

              {/* Main image container */}
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-border">
                {/* Mockup of exam interface */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary to-info rounded-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          Computer Science 301
                        </h3>
                        <p className="text-sm text-secondary">
                          Final Examination
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-success font-medium">
                      ✓ Verified
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-3">
                      Question 1 of 25
                    </h4>
                    <p className="text-sm text-secondary mb-4">
                      Which of the following best describes the time complexity
                      of a binary search algorithm?
                    </p>
                    <div className="space-y-2">
                      {['O(n)', 'O(log n)', 'O(n²)', 'O(1)'].map(
                        (option, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <div className="w-4 h-4 border-2 border-primary rounded-full" />
                            <span className="text-sm text-secondary">
                              {option}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-secondary">
                      Time remaining:{' '}
                      <span className="font-medium text-foreground">
                        1:45:30
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      Next Question →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-info/5 rounded-full blur-3xl" />
      </div>
    </section>
  )
}

export default HeroSection
