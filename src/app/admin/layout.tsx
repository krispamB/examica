export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar will be added later */}
        <div className="w-64 bg-white shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
          </div>
          <nav className="mt-6">
            <div className="px-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Navigation
              </p>
              <div className="mt-2 space-y-1">
                <a
                  href="/admin"
                  className="block px-3 py-2 text-sm text-gray-700 rounded-md"
                >
                  Dashboard
                </a>
                <a
                  href="/admin/users"
                  className="block px-3 py-2 text-sm text-gray-700 rounded-md"
                >
                  Users
                </a>
                <a
                  href="/admin/settings"
                  className="block px-3 py-2 text-sm text-gray-700 rounded-md"
                >
                  Settings
                </a>
              </div>
            </div>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <header className="bg-white shadow-sm border-b">
            <div className="px-6 py-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Administrator Dashboard
              </h1>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
