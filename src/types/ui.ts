export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export interface InputProps extends BaseComponentProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  label?: string
  required?: boolean
  disabled?: boolean
}

export interface CardProps extends BaseComponentProps {
  title?: string
  description?: string
}

export interface NavigationItem {
  label: string
  href: string
  icon?: React.ReactNode
  badge?: string | number
}

export interface SidebarProps extends BaseComponentProps {
  isCollapsed?: boolean
  onToggle?: () => void
  items: NavigationItem[]
}
