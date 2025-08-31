export default function ExaminerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Dashboard Overview
        </h2>
        <p className="mt-2 text-secondary">
          Manage your exams, monitor students, and analyze performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground">My Exams</h3>
          <p className="mt-2 text-3xl font-bold text-primary">0</p>
          <p className="mt-1 text-sm text-secondary">Active exams</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground">Students</h3>
          <p className="mt-2 text-3xl font-bold text-success">0</p>
          <p className="mt-1 text-sm text-secondary">Enrolled students</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground">Avg Score</h3>
          <p className="mt-2 text-3xl font-bold text-info">-</p>
          <p className="mt-1 text-sm text-secondary">Latest exam average</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Quick Actions
          </h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-border rounded-lg hover:bg-background-secondary text-left transition-colors">
              <div className="text-sm font-medium text-foreground">
                Create New Exam
              </div>
              <div className="text-sm text-secondary">
                Start creating a new examination
              </div>
            </button>
            <button className="p-4 border border-border rounded-lg hover:bg-background-secondary text-left transition-colors">
              <div className="text-sm font-medium text-foreground">
                View Results
              </div>
              <div className="text-sm text-secondary">
                Check recent exam results
              </div>
            </button>
            <button className="p-4 border border-border rounded-lg hover:bg-background-secondary text-left transition-colors">
              <div className="text-sm font-medium text-foreground">
                Monitor Live
              </div>
              <div className="text-sm text-secondary">
                Monitor ongoing exams
              </div>
            </button>
            <button className="p-4 border border-border rounded-lg hover:bg-background-secondary text-left transition-colors">
              <div className="text-sm font-medium text-foreground">
                Generate Report
              </div>
              <div className="text-sm text-secondary">
                Create performance reports
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
