'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { type BaseComponentProps } from '@/types/ui'
import { UserRole } from '@/types/auth'
import { Json } from '@/types/database.types'
import { getDefaultRedirectPath } from '@/lib/auth'

interface InvitationAcceptanceFormProps extends BaseComponentProps {
  onSuccess?: () => void
}

interface InvitationData {
  id: string
  email: string
  role: UserRole
  invited_by: string
  expires_at: string
  status: string
  user_metadata: Json
}

const InvitationAcceptanceForm: React.FC<InvitationAcceptanceFormProps> = ({
  onSuccess,
  className,
  ...props
}) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [validating, setValidating] = useState(true)

  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const validateInvitation = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setError('Invalid invitation link')
        setValidating(false)
        return
      }

      try {
        // Query the invitation directly from the user_invitations table
        const { data, error } = await supabase
          .from('user_invitations')
          .select('*')
          .eq('invitation_token', token)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .single()

        if (error) throw error

        if (!data) {
          setError('Invalid or expired invitation link')
          setValidating(false)
          return
        }

        setInvitation(data)
        setValidating(false)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to validate invitation'
        )
        setValidating(false)
      }
    }

    validateInvitation()
  }, [searchParams, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitation) return

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

    setLoading(true)

    try {
      // Call our secure API endpoint to create the user
      const response = await fetch('/api/accept-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: searchParams.get('token'),
          firstName,
          lastName,
          password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept invitation')
      }

      // Now sign in the user automatically
      const { data: _signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: invitation.email,
          password: password,
        })

      if (signInError) throw signInError

      // Invitation is already marked as accepted by the API endpoint

      setSuccess(true)
      onSuccess?.()

      // Redirect user to their appropriate dashboard after a brief delay
      setTimeout(() => {
        const redirectPath = getDefaultRedirectPath(invitation.role as UserRole)
        router.push(redirectPath)
      }, 2000)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to accept invitation'
      )
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="text-center space-y-4" {...props}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-secondary">Validating invitation...</p>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="text-center space-y-4" {...props}>
        <div className="bg-error-light border border-error/20 text-error px-4 py-3 rounded-md">
          <p className="font-medium">Invalid Invitation</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Button onClick={() => router.push('/login')} variant="outline">
          Go to Login
        </Button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center space-y-4" {...props}>
        <div className="bg-success-light border border-success/20 text-success px-4 py-3 rounded-md">
          <p className="font-medium">Account created successfully!</p>
          <p className="text-sm mt-1">
            You are now logged in and will be redirected to your dashboard.
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

        {invitation && (
          <div className="bg-primary-light border border-primary/20 text-primary px-4 py-3 rounded-md">
            <p className="font-medium">
              You&apos;re invited as a {invitation.role}
            </p>
            <p className="text-sm mt-1">Email: {invitation.email}</p>
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

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          Accept Invitation
        </Button>
      </div>
    </form>
  )
}

export default InvitationAcceptanceForm
