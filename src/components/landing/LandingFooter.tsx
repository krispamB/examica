'use client'

import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Logo from '@/components/common/Logo'
import {
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from 'lucide-react'

interface LandingFooterProps {
  className?: string
}

const LandingFooter: React.FC<LandingFooterProps> = ({ className }) => {
  const footerLinks = {
    platform: [
      { label: 'Student Portal', href: '/student' },
      { label: 'Faculty Portal', href: '/examiner' },
      { label: 'Admin Console', href: '/admin' },
      { label: 'System Status', href: '/status' },
    ],
    university: [
      { label: 'About University of Jos', href: 'https://unijos.edu.ng/about' },
      { label: 'Academic Calendar', href: 'https://unijos.edu.ng/calendar' },
      {
        label: 'Faculties & Departments',
        href: 'https://unijos.edu.ng/faculties',
      },
      { label: 'Admissions', href: 'https://unijos.edu.ng/admissions' },
    ],
    resources: [
      { label: 'Student Guides', href: '#resources' },
      { label: 'Faculty Training', href: '#resources' },
      { label: 'Technical Documentation', href: '#resources' },
      { label: 'System Requirements', href: '#resources' },
    ],
    support: [
      { label: 'Help Center', href: '#support' },
      { label: 'Contact IT Support', href: '#support' },
      { label: 'Report an Issue', href: '#support' },
      { label: 'Emergency Support', href: '#support' },
    ],
  }

  const socialLinks = [
    {
      icon: Facebook,
      href: 'https://facebook.com/universityofjos',
      label: 'Facebook',
    },
    { icon: Twitter, href: 'https://twitter.com/unijos', label: 'Twitter' },
    {
      icon: Instagram,
      href: 'https://instagram.com/universityofjos',
      label: 'Instagram',
    },
    {
      icon: Linkedin,
      href: 'https://linkedin.com/school/university-of-jos',
      label: 'LinkedIn',
    },
  ]

  return (
    <footer className={cn('bg-gray-900 text-white', className)}>
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          {/* University & Platform Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <Logo size="md" className="items-start text-white" />
              <p className="text-gray-300 text-sm mt-2">University of Jos</p>
              <p className="text-gray-400 text-sm">
                Computer-Based Testing Platform
              </p>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Secure, AI-enhanced examination platform ensuring academic
              integrity and excellence for the University of Jos community.
            </p>

            {/* University Contact Info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3 text-gray-300">
                <MapPin className="w-4 h-4 text-primary" />
                <span>PMB 2084, Jos, Plateau State, Nigeria</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Phone className="w-4 h-4 text-primary" />
                <span>+234 (0) 73 xxx-xxxx</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Mail className="w-4 h-4 text-primary" />
                <span>examica@unijos.edu.ng</span>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Platform Access</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center space-x-1"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* University Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">University of Jos</h3>
            <ul className="space-y-3">
              {footerLinks.university.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center space-x-1"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-3 mb-6">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Emergency Support CTA */}
            <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4">
              <h4 className="font-medium text-red-300 mb-2 text-sm">
                Emergency Support
              </h4>
              <p className="text-red-200 text-xs mb-3">
                For urgent exam issues
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-red-600 text-red-300 hover:bg-red-900/30 bg-transparent text-xs w-full"
              >
                Call Now: 073-xxx-xxxx
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter & Social */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            {/* Newsletter Signup */}
            <div className="flex-1 max-w-md">
              <h4 className="font-medium text-white mb-2">Stay Updated</h4>
              <p className="text-gray-400 text-sm mb-4">
                Get notifications about system updates and announcements
              </p>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Button variant="primary" size="sm">
                  Subscribe
                </Button>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-gray-300 hover:text-white" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-400">
              <p>
                © {new Date().getFullYear()} University of Jos. All rights
                reserved.
              </p>
              <div className="flex space-x-4">
                <a
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
                <a href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a
                  href="/security"
                  className="hover:text-white transition-colors"
                >
                  Security
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Powered by</span>
              <div className="flex items-center space-x-1">
                <Logo size="sm" className="text-primary" />
                <span className="text-white font-medium">Examica</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter
