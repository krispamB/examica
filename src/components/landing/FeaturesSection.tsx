'use client'

import { cn } from '@/lib/utils'
import Card from '@/components/ui/Card'
import {
  Brain,
  Shield,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
} from 'lucide-react'

interface FeaturesSectionProps {
  className?: string
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ className }) => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Question Generation',
      description:
        'Generate diverse, high-quality questions instantly with our advanced AI system. Create comprehensive assessments that adapt to your curriculum.',
      highlight: 'For Faculty',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Shield,
      title: 'Secure Facial Authentication',
      description:
        'Ensure academic integrity with our advanced facial recognition system. Verify student identity before and during examinations.',
      highlight: 'For Students',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description:
        'Monitor exam progress and performance with comprehensive analytics. Get insights into student performance and question effectiveness.',
      highlight: 'For Administrators',
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ]

  const benefits = [
    { icon: Users, text: 'Multi-role access control' },
    { icon: Clock, text: 'Automated exam scheduling' },
    { icon: CheckCircle, text: 'Instant result processing' },
  ]

  return (
    <section
      id="features"
      className={cn('py-20 sm:py-24 bg-background-secondary', className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Powerful Features for{' '}
            <span className="text-gradient">Academic Excellence</span>
          </h2>
          <p className="text-lg text-secondary max-w-3xl mx-auto">
            Our comprehensive platform provides everything the University of Jos
            needs for secure, efficient, and effective digital examinations.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="card-hover border-0 shadow-md bg-background"
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={cn('p-3 rounded-lg', feature.bgColor)}>
                    <feature.icon className={cn('w-6 h-6', feature.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <span
                        className={cn(
                          'text-xs font-medium px-2 py-1 rounded-full',
                          feature.bgColor,
                          feature.color
                        )}
                      >
                        {feature.highlight}
                      </span>
                    </div>
                    <p className="text-secondary text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Feature Highlight - Single Standout */}
        <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
            <div className="p-8 lg:p-12">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Security Focus
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Advanced Exam Security
              </h3>
              <p className="text-secondary text-lg leading-relaxed mb-6">
                Our facial recognition system ensures that only verified
                students can access exams, maintaining the highest standards of
                academic integrity at the University of Jos.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <benefit.icon className="w-5 h-5 text-success" />
                    <span className="text-sm text-secondary">
                      {benefit.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup/Screenshot */}
            <div className="p-8 lg:p-12 bg-gradient-to-br from-primary/5 to-info/5">
              <div className="bg-white rounded-xl shadow-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-foreground">
                    Security Verification
                  </h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    <span className="text-xs text-success font-medium">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-info rounded-full mx-auto mb-3 flex items-center justify-center">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-center text-sm text-secondary">
                      Student Identity Confirmed
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="text-center">
                      <div className="text-lg font-bold text-success">
                        99.9%
                      </div>
                      <div className="text-secondary">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">0.5s</div>
                      <div className="text-secondary">Verification Time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
