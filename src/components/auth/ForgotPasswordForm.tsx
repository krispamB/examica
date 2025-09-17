'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { type BaseComponentProps } from '@/types/ui'

interface ForgotPasswordFormProps extends BaseComponentProps {
  onSuccess?: () => void
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
  className,
  ...props
}) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await resetPassword(email)

      if (error) throw new Error(error)

      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send reset email'
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-success-light border border-success/20 text-success px-4 py-3 rounded-md">
          <p className="font-medium">Reset email sent!</p>
          <p className="text-sm mt-1">
            Check your email for a link to reset your password.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setSuccess(false)}
          className="text-sm"
        >
          Send another email
        </Button>
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

        <Input
          type="email"
          label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          disabled={loading}
        />

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          Send reset email
        </Button>
      </div>
    </form>
  )
}

export default ForgotPasswordForm
