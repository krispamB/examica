'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import FaceImageUpload from '@/components/common/FaceImageUpload'
import { inviteUser } from '@/lib/invitations'
import { type BaseComponentProps } from '@/types/ui'
import { UserRole } from '@/types/auth'

interface InviteUserFormProps extends BaseComponentProps {
  onSuccess?: () => void
}

const InviteUserForm: React.FC<InviteUserFormProps> = ({
  onSuccess,
  className,
  ...props
}) => {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [faceImage, setFaceImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const result = await inviteUser({
        email,
        role,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        faceImage: faceImage || undefined,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      setSuccess(`Invitation sent successfully to ${email}`)

      // Reset form
      setEmail('')
      setFirstName('')
      setLastName('')
      setRole('student')
      setFaceImage(null)

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className} {...props}>
      <div className="space-y-6">
        {error && (
          <div className="bg-error-light border border-error/20 text-error px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success-light border border-success/20 text-success px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        <Input
          type="email"
          label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter user's email"
          required
          disabled={loading}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Input
            type="text"
            label="First name (optional)"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter first name"
            disabled={loading}
          />

          <Input
            type="text"
            label="Last name (optional)"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter last name"
            disabled={loading}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            Role
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

        {/* Face Image Upload - only show for students */}
        {role === 'student' && (
          <FaceImageUpload
            onImageSelect={setFaceImage}
            selectedImage={faceImage}
            disabled={loading}
          />
        )}

        <div className="bg-warning-light border border-warning/20 text-warning px-4 py-3 rounded-md text-sm">
          <p className="font-medium">Note:</p>
          <p>
            The invited user will receive an email with instructions to complete
            their account setup. The invitation will expire in 7 days.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          Send Invitation
        </Button>
      </div>
    </form>
  )
}

export default InviteUserForm
