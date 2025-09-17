'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { type BaseComponentProps } from '@/types/ui'

type EmailVerificationHandlerProps = BaseComponentProps

const EmailVerificationHandler: React.FC<EmailVerificationHandlerProps> = ({
  ...props
}) => {
  const [status, setStatus] = useState<
    'verifying' | 'success' | 'error' | 'expired'
  >('verifying')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const type = searchParams.get('type')
        const tokenHash = searchParams.get('token_hash')

        if (type === 'email' && tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: 'email',
            token_hash: tokenHash,
          })

          if (error) {
            if (error.message.includes('expired')) {
              setStatus('expired')
            } else {
              throw error
            }
          } else {
            setStatus('success')
            // Redirect to dashboard after successful verification
            setTimeout(() => {
              router.push('/login')
            }, 2000)
          }
        } else {
          setStatus('error')
          setError('Invalid verification link')
        }
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Verification failed')
      }
    }

    verifyEmail()
  }, [searchParams, supabase.auth, router])

  const handleResendVerification = async () => {
    if (!user?.email) {
      setError('No user email found')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      })

      if (error) throw error

      setStatus('success')
      setError(null)
      alert('Verification email sent! Please check your inbox.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to resend verification email'
      )
    } finally {
      setLoading(false)
    }
  }

  if (status === 'verifying') {
    return (
      <div className="text-center space-y-4" {...props}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-secondary">Verifying your email address...</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center space-y-4" {...props}>
        <div className="bg-success-light border border-success/20 text-success px-4 py-3 rounded-md">
          <p className="font-medium">Email verified successfully!</p>
          <p className="text-sm mt-1">
            You can now sign in to your account. Redirecting to login page...
          </p>
        </div>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="text-center space-y-4" {...props}>
        <div className="bg-warning-light border border-warning/20 text-warning px-4 py-3 rounded-md">
          <p className="font-medium">Verification link expired</p>
          <p className="text-sm mt-1">
            The verification link has expired. Please request a new one.
          </p>
        </div>

        <Button
          onClick={handleResendVerification}
          loading={loading}
          disabled={loading}
          variant="primary"
        >
          Resend verification email
        </Button>

        {error && (
          <div className="bg-error-light border border-error/20 text-error px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="text-center space-y-4" {...props}>
      <div className="bg-error-light border border-error/20 text-error px-4 py-3 rounded-md">
        <p className="font-medium">Verification failed</p>
        <p className="text-sm mt-1">
          {error || 'There was an error verifying your email address.'}
        </p>
      </div>

      <Button
        onClick={handleResendVerification}
        loading={loading}
        disabled={loading}
        variant="primary"
      >
        Resend verification email
      </Button>
    </div>
  )
}

export default EmailVerificationHandler
