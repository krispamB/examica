'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { type BaseComponentProps } from '@/types/ui'

interface LoginFormProps extends BaseComponentProps {
  onSubmit?: (email: string, password: string) => Promise<void>
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  className,
  ...props
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onSubmit) return

    setLoading(true)
    setError(null)

    try {
      await onSubmit(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className} {...props}>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
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

        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          disabled={loading}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-900"
            >
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a
              href="#"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </a>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          Sign in
        </Button>
      </div>
    </form>
  )
}

export default LoginForm
