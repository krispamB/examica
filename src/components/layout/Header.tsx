'use client'

import { type BaseComponentProps } from '@/types/ui'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'

interface HeaderProps extends BaseComponentProps {
  title?: string
  showUserMenu?: boolean
  onMenuToggle?: () => void
}

const Header: React.FC<HeaderProps> = ({
  title = 'Examica',
  showUserMenu = true,
  onMenuToggle,
  className,
  children,
  ...props
}) => {
  return (
    <header
      className={cn(
        'bg-background shadow-sm border-b border-border px-6 py-4',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="p-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          )}
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center space-x-4">
          {children}

          {showUserMenu && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 p-2"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-secondary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <svg
                  className="w-4 h-4 text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
