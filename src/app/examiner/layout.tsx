export default function ExaminerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Examiner Panel
            </h2>
          </div>
          <nav className="mt-6">
            <div className="px-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Navigation
              </p>
              <div className="mt-2 space-y-1">
                <a
                  href="/examiner"
                  className="block px-3 py-2 text-sm text-gray-700 rounded-md"
                >
                  Dashboard
                </a>
                <a
                  href="/examiner/exams"
                  className="block px-3 py-2 text-sm text-gray-700 rounded-md"
                >
                  My Exams
                </a>
                <a
                  href="/examiner/create"
                  className="block px-3 py-2 text-sm text-gray-700 rounded-md"
                >
                  Create Exam
                </a>
                <a
                  href="/examiner/students"
                  className="block px-3 py-2 text-sm text-gray-700 rounded-md"
                >
                  Students
                </a>
                <a
                  href="/examiner/analytics"
                  className="block px-3 py-2 text-sm text-gray-700 rounded-md"
                >
                  Analytics
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
                Examiner Portal
              </h1>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
