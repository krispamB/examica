'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import InviteUserForm from './InviteUserForm'
import UserInvitationsList from './UserInvitationsList'
import UsersList from './UsersList'
import { type BaseComponentProps } from '@/types/ui'

type UserManagementProps = BaseComponentProps

const UserManagement: React.FC<UserManagementProps> = ({
  className,
  ...props
}) => {
  const [activeTab, setActiveTab] = useState<
    'users' | 'invitations' | 'invite'
  >('users')

  const tabs = [
    {
      id: 'users',
      label: 'All Users',
      description: 'View and manage existing users',
    },
    {
      id: 'invitations',
      label: 'Invitations',
      description: 'Manage pending and sent invitations',
    },
    {
      id: 'invite',
      label: 'Send Invitation',
      description: 'Invite new users to join',
    },
  ] as const

  return (
    <div className={className} {...props}>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-secondary hover:text-foreground hover:border-border'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Active Tab Description */}
          <div className="text-center">
            <p className="text-secondary">
              {tabs.find((tab) => tab.id === activeTab)?.description}
            </p>
          </div>

          {/* Tab Panels */}
          {activeTab === 'users' && <UsersList />}
          {activeTab === 'invitations' && <UserInvitationsList />}
          {activeTab === 'invite' && (
            <Card className="max-w-2xl mx-auto">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-foreground">
                    Invite New User
                  </h3>
                  <p className="text-sm text-secondary mt-2">
                    Send an invitation to allow someone to join your institution
                  </p>
                </div>
                <InviteUserForm onSuccess={() => setActiveTab('invitations')} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserManagement
