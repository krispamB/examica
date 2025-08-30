export default function ExaminerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Examiner Dashboard</h2>
        <p className="mt-2 text-gray-600">
          Manage your exams, monitor students, and analyze performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">My Exams</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">0</p>
          <p className="mt-1 text-sm text-gray-500">Active exams</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Students</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">0</p>
          <p className="mt-1 text-sm text-gray-500">Enrolled students</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Avg Score</h3>
          <p className="mt-2 text-3xl font-bold text-purple-600">-</p>
          <p className="mt-1 text-sm text-gray-500">Latest exam average</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-sm font-medium text-gray-900">
                Create New Exam
              </div>
              <div className="text-sm text-gray-500">
                Start creating a new examination
              </div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-sm font-medium text-gray-900">
                View Results
              </div>
              <div className="text-sm text-gray-500">
                Check recent exam results
              </div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-sm font-medium text-gray-900">
                Monitor Live
              </div>
              <div className="text-sm text-gray-500">Monitor ongoing exams</div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-sm font-medium text-gray-900">
                Generate Report
              </div>
              <div className="text-sm text-gray-500">
                Create performance reports
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
