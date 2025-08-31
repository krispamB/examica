'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { type BaseComponentProps } from '@/types/ui'
import { UserRole } from '@/types/auth'

interface RegisterFormProps extends BaseComponentProps {
  onSuccess?: () => void
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  className,
  ...props
}) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        role,
      })

      if (error) throw new Error(error)

      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-success-light border border-success/20 text-success px-4 py-3 rounded-md">
          <p className="font-medium">Registration successful!</p>
          <p className="text-sm mt-1">
            Please check your email to verify your account before signing in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className} {...props}>
      <div className="space-y-6">
        {error && (
          <div className="bg-error-light border border-error/20 text-error px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Input
            type="text"
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
            required
            disabled={loading}
          />

          <Input
            type="text"
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
            required
            disabled={loading}
          />
        </div>

        <Input
          type="email"
          label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          disabled={loading}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            Account Type
            <span className="text-error ml-1">*</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-primary focus:ring-primary transition-all duration-200 disabled:bg-background-secondary disabled:cursor-not-allowed"
          >
            <option value="student">Student</option>
            <option value="examiner">Examiner/Staff</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a strong password"
          required
          disabled={loading}
        />

        <Input
          type="password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
          disabled={loading}
        />

        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            required
            disabled={loading}
            className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-foreground">
            I agree to the{' '}
            <a
              href="#"
              className="font-medium text-primary hover:text-primary-hover"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="#"
              className="font-medium text-primary hover:text-primary-hover"
            >
              Privacy Policy
            </a>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          Create account
        </Button>
      </div>
    </form>
  )
}

export default RegisterForm
