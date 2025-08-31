import { type InputProps } from '@/types/ui'
import { cn } from '@/lib/utils'

const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  label,
  required = false,
  disabled = false,
  className,
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={cn(
          'w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200',
          error
            ? 'border-error/30 focus:border-error focus:ring-error'
            : 'border-border focus:border-primary focus:ring-primary',
          disabled && 'bg-background-secondary cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
}

export default Input
