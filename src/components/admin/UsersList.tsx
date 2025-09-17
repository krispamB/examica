'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { type BaseComponentProps } from '@/types/ui'
import { X, Edit, Save, XCircle } from 'lucide-react'

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    role: '',
  })
  const [updating, setUpdating] = useState(false)

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

  const openUserDetails = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    })
    setIsEditMode(false)
  }

  const closeUserDetails = () => {
    setSelectedUser(null)
    setIsEditMode(false)
    setEditForm({ first_name: '', last_name: '', role: '' })
  }

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleCancelEdit = () => {
    if (selectedUser) {
      setEditForm({
        first_name: selectedUser.first_name,
        last_name: selectedUser.last_name,
        role: selectedUser.role,
      })
    }
    setIsEditMode(false)
  }

  const handleSave = async () => {
    if (!selectedUser) return

    setUpdating(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          role: editForm.role as 'admin' | 'examiner' | 'student',
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === selectedUser.id ? { ...user, ...editForm } : user
        )
      )

      setSelectedUser({ ...selectedUser, ...editForm })
      setIsEditMode(false)
    } catch (err) {
      console.error('Update user error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setUpdating(false)
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
                      onClick={() => openUserDetails(user)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">
                  {isEditMode ? 'Edit User' : 'User Details'}
                </h3>
                <Button variant="ghost" size="sm" onClick={closeUserDetails}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    First Name
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, first_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter first name"
                    />
                  ) : (
                    <p className="text-foreground">
                      {selectedUser.first_name || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Last Name
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, last_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter last name"
                    />
                  ) : (
                    <p className="text-foreground">
                      {selectedUser.last_name || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Role
                  </label>
                  {isEditMode ? (
                    <select
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm({ ...editForm, role: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="student">Student</option>
                      <option value="examiner">Examiner</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize
                          ${getRoleBadgeColor(selectedUser.role)}
                        `}
                      >
                        {selectedUser.role}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    User ID
                  </label>
                  <p className="text-secondary text-sm font-mono">
                    {selectedUser.id}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Created
                  </label>
                  <p className="text-secondary">
                    {selectedUser.created_at
                      ? new Date(selectedUser.created_at).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )
                      : 'Unknown'}
                  </p>
                </div>

                {selectedUser.invitation_accepted_at && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Invitation Accepted
                    </label>
                    <p className="text-secondary">
                      {new Date(
                        selectedUser.invitation_accepted_at
                      ).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}

                {selectedUser.auth_user?.email && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Email
                    </label>
                    <p className="text-secondary">
                      {selectedUser.auth_user.email}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
                {isEditMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={updating}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={updating}>
                      <Save className="w-4 h-4 mr-1" />
                      {updating ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={closeUserDetails}>
                      Close
                    </Button>
                    <Button onClick={handleEdit}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit User
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UsersList
