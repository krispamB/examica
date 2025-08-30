import { type BaseComponentProps } from '@/types/ui'
import { cn } from '@/lib/utils'

interface FooterProps extends BaseComponentProps {
  showLinks?: boolean
  showCopyright?: boolean
}

const Footer: React.FC<FooterProps> = ({
  showLinks = true,
  showCopyright = true,
  className,
  children,
  ...props
}) => {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className={cn('bg-white border-t border-gray-200 mt-auto', className)}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Examica</h3>
              <span className="text-sm text-gray-500">
                Computer-Based Testing
              </span>
            </div>

            {showLinks && (
              <nav className="flex flex-wrap items-center space-x-6 text-sm text-gray-600">
                <a
                  href="/about"
                  className="hover:text-gray-900 transition-colors"
                >
                  About
                </a>
                <a
                  href="/privacy"
                  className="hover:text-gray-900 transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="/terms"
                  className="hover:text-gray-900 transition-colors"
                >
                  Terms of Service
                </a>
                <a
                  href="/support"
                  className="hover:text-gray-900 transition-colors"
                >
                  Support
                </a>
                <a
                  href="/contact"
                  className="hover:text-gray-900 transition-colors"
                >
                  Contact
                </a>
              </nav>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 mt-4 md:mt-0">
            {children}

            {showCopyright && (
              <p className="text-sm text-gray-500">
                © {currentYear} Examica. All rights reserved.
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
