import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showSubtitle?: boolean
}

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className,
  showSubtitle = false,
}) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  }

  const subtitleSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <h1
        className={cn(
          'font-bold text-gradient tracking-tight',
          sizeClasses[size]
        )}
        style={{ fontFamily: 'var(--font-geist-sans)' }}
      >
        Examica
      </h1>
      {showSubtitle && (
        <p
          className={cn('text-secondary mt-1 font-medium', subtitleSizes[size])}
        >
          Computer-Based Testing Platform
        </p>
      )}
    </div>
  )
}

export default Logo
