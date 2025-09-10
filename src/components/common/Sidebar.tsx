'use client'

import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import Logo from './Logo'
import Link from 'next/link'

interface NavigationItem {
  name: string
  href: string
  icon?: string
}

interface SidebarProps {
  role: 'admin' | 'student' | 'examiner'
  className?: string
}

const navigationConfig: Record<string, NavigationItem[]> = {
  admin: [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Exams', href: '/admin/exams' },
    { name: 'Monitor', href: '/admin/monitor' },
    { name: 'Settings', href: '/admin/settings' },
  ],
  student: [
    { name: 'Dashboard', href: '/student' },
    { name: 'Available Exams', href: '/student/exams' },
    { name: 'My Results', href: '/student/results' },
    { name: 'Profile', href: '/student/profile' },
  ],
  examiner: [
    { name: 'Dashboard', href: '/examiner' },
    { name: 'My Exams', href: '/examiner/exams' },
    { name: 'Create Exam', href: '/examiner/create' },
    { name: 'Exam Results', href: '/examiner/results' },
    { name: 'Students', href: '/examiner/students' },
    { name: 'Analytics', href: '/examiner/analytics' },
  ],
}

const Sidebar: React.FC<SidebarProps> = ({ role, className }) => {
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
        alert('Logout failed: ' + error.message)
        return
      }
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
      alert('Logout failed: ' + error)
    }
  }

  const navigation = navigationConfig[role] || []

  return (
    <div
      className={cn(
        'w-64 bg-white shadow-sm border-r border-border flex flex-col h-screen',
        className
      )}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <Logo size="md" />
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 py-6">
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Navigation
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary-light text-primary'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Logout Section */}
      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className={cn(
            'w-full px-3 py-2 text-sm font-medium rounded-md transition-colors',
            'bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800',
            'border border-red-200 hover:border-red-300',
            'flex items-center justify-center gap-2'
          )}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar
