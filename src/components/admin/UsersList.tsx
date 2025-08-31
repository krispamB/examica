'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { type BaseComponentProps } from '@/types/ui'

interface User {
  id: string
  first_name: string
  last_name: string
  role: string
  created_at: string | null
  invited_by?: string | null
  invitation_accepted_at?: string | null
  auth_user?: {
    email: string
    email_confirmed_at: string
    last_sign_in_at: string
  }
}

type UsersListProps = BaseComponentProps

const UsersList: React.FC<UsersListProps> = ({ className, ...props }) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const supabase = createClient()

    try {
      // Get user profiles with auth data
      const { data, error } = await supabase
        .from('user_profiles')
        .select(
          `
          id,
          first_name,
          last_name,
          role,
          created_at,
          invited_by,
          invitation_accepted_at
        `
        )
        .order('created_at', { ascending: false })

      if (error) throw error

      // Note: In a real implementation, you'd need to join with auth.users
      // through a database function since auth.users is not directly accessible
      // from the client. For now, we'll show the profile data we have.

      setUsers(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-error-light text-error border-error/20'
      case 'examiner':
        return 'bg-warning-light text-warning border-warning/20'
      case 'student':
        return 'bg-primary-light text-primary border-primary/20'
      default:
        return 'bg-secondary-light text-secondary border-secondary/20'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-secondary mt-2">Loading users...</p>
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

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-foreground">All Users</h3>
            <p className="text-sm text-secondary">
              Total: {users.length} user{users.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={loadUsers}>
              Refresh
            </Button>
          </div>
        </div>

        {users.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-secondary">No users found</p>
            <p className="text-sm text-secondary mt-2">
              Users will appear here once they accept invitations
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {`${user.first_name} ${user.last_name}`.trim() ||
                            'No name provided'}
                        </p>
                        <p className="text-sm text-secondary">
                          ID: {user.id.slice(0, 8)}...
                        </p>
                      </div>
                      <span
                        className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize
                        ${getRoleBadgeColor(user.role)}
                      `}
                      >
                        {user.role}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-secondary space-y-1">
                      <p>
                        Created:{' '}
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : 'Unknown'}
                      </p>
                      {user.invitation_accepted_at && (
                        <p>
                          Joined:{' '}
                          {new Date(
                            user.invitation_accepted_at
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // TODO: Implement user details/edit functionality
                        console.log('View user details:', user.id)
                      }}
                    >
                      View Details
                    </Button>
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

export default UsersList
