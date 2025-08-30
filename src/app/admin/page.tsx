export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="mt-2 text-gray-600">
          Welcome to the Examica administration panel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">0</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Active Exams</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">0</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">
            Completed Exams
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-600">0</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">Good</p>
        </div>
      </div>
    </div>
  )
}
