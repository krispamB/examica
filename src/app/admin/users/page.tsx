import UserManagement from '@/components/admin/UserManagement'

export default function AdminUsersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            User Management
          </h1>
          <p className="text-secondary mt-2">
            Manage users, send invitations, and control access to your
            institution
          </p>
        </div>

        <UserManagement />
      </div>
    </div>
  )
}
