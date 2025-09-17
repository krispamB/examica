import { type CardProps } from '@/types/ui'
import { cn } from '@/lib/utils'

const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-background rounded-lg border border-border shadow-sm',
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="px-6 py-4 border-b border-border">
          {title && (
            <h3 className="text-lg font-medium text-foreground">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-secondary">{description}</p>
          )}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  )
}

export default Card
