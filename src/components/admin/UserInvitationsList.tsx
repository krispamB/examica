'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import {
  getInvitations,
  cancelInvitation,
  resendInvitation,
} from '@/lib/invitations'
import { type BaseComponentProps } from '@/types/ui'

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
  invited_by_profile?: {
    first_name: string
    last_name: string
  }
}

type UserInvitationsListProps = BaseComponentProps

const UserInvitationsList: React.FC<UserInvitationsListProps> = ({
  className,
  ...props
}) => {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    try {
      const data = await getInvitations()
      setInvitations(data)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load invitations'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    setActionLoading(invitationId)
    try {
      const result = await cancelInvitation(invitationId)
      if (!result.success) {
        throw new Error(result.error)
      }
      await loadInvitations()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to cancel invitation'
      )
    } finally {
      setActionLoading(null)
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading(invitationId)
    try {
      const result = await resendInvitation(invitationId)
      if (!result.success) {
        throw new Error(result.error)
      }
      await loadInvitations()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to resend invitation'
      )
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-light text-warning border-warning/20'
      case 'accepted':
        return 'bg-success-light text-success border-success/20'
      case 'expired':
        return 'bg-error-light text-error border-error/20'
      case 'cancelled':
        return 'bg-secondary-light text-secondary border-secondary/20'
      default:
        return 'bg-secondary-light text-secondary border-secondary/20'
    }
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-secondary mt-2">Loading invitations...</p>
      </div>
    )
  }

  return (
    <div className={className} {...props}>
      <div className="space-y-6">
        {error && (
          <div className="bg-error-light border border-error/20 text-error px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {invitations.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-secondary">No invitations found</p>
            <p className="text-sm text-secondary mt-2">
              Send your first invitation to get started
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {invitation.email}
                        </p>
                        <p className="text-sm text-secondary capitalize">
                          Role: {invitation.role}
                        </p>
                      </div>
                      <span
                        className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${getStatusColor(invitation.status)}
                      `}
                      >
                        {invitation.status}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-secondary space-y-1">
                      <p>
                        Sent:{' '}
                        {new Date(invitation.created_at).toLocaleDateString()}{' '}
                        by{' '}
                        {invitation.invited_by_profile
                          ? `${invitation.invited_by_profile.first_name} ${invitation.invited_by_profile.last_name}`.trim()
                          : 'Admin'}
                      </p>
                      <p
                        className={
                          isExpired(invitation.expires_at) ? 'text-error' : ''
                        }
                      >
                        {isExpired(invitation.expires_at)
                          ? 'Expired: '
                          : 'Expires: '}
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {invitation.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvitation(invitation.id)}
                          loading={actionLoading === invitation.id}
                          disabled={actionLoading === invitation.id}
                        >
                          Resend
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelInvitation(invitation.id)}
                          loading={actionLoading === invitation.id}
                          disabled={actionLoading === invitation.id}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserInvitationsList
