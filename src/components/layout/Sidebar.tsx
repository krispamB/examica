'use client'

import { type SidebarProps } from '@/types/ui'
import { cn } from '@/lib/utils'

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggle,
  items,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white shadow-sm border-r border-gray-200 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
      {...props}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2
            className={cn(
              'text-lg font-semibold text-gray-900 transition-opacity duration-300',
              isCollapsed && 'opacity-0'
            )}
          >
            Navigation
          </h2>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              <svg
                className={cn(
                  'w-5 h-5 transition-transform duration-300',
                  isCollapsed && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <nav className="mt-6">
        <div className="px-3">
          <div className="space-y-1">
            {items.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200',
                  isCollapsed ? 'justify-center' : 'justify-start'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon && (
                  <span className={cn('flex-shrink-0', !isCollapsed && 'mr-3')}>
                    {item.icon}
                  </span>
                )}
                <span
                  className={cn(
                    'transition-opacity duration-300',
                    isCollapsed && 'opacity-0 w-0 overflow-hidden'
                  )}
                >
                  {item.label}
                </span>
                {item.badge && !isCollapsed && (
                  <span className="ml-auto bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {children && !isCollapsed && <div className="mt-6 px-3">{children}</div>}
    </div>
  )
}

export default Sidebar
