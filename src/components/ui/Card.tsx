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
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && (
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  )
}

export default Card
