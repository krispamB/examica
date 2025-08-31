'use client'

import { cn } from '@/lib/utils'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  role: 'admin' | 'student' | 'examiner'
  children: React.ReactNode
  pageTitle?: string
  className?: string
}

const roleLabels = {
  admin: 'Administrator Dashboard',
  student: 'Student Portal',
  examiner: 'Examiner Portal',
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  children,
  pageTitle,
  className,
}) => {
  const defaultTitle = roleLabels[role]
  const title = pageTitle || defaultTitle

  return (
    <div className={cn('min-h-screen bg-background-secondary flex', className)}>
      {/* Sidebar */}
      <Sidebar role={role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-border">
          <div className="px-6 py-4">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
