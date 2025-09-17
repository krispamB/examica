export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Dashboard Overview
        </h2>
        <p className="mt-2 text-secondary">
          Welcome to your examination portal. View available exams and track
          your progress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Available Exams
          </h3>
          <p className="mt-2 text-3xl font-bold text-primary">0</p>
          <p className="mt-1 text-sm text-secondary">Ready to take</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground">Completed</h3>
          <p className="mt-2 text-3xl font-bold text-success">0</p>
          <p className="mt-1 text-sm text-secondary">Exams completed</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Average Score
          </h3>
          <p className="mt-2 text-3xl font-bold text-info">-</p>
          <p className="mt-1 text-sm text-secondary">Your performance</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Upcoming Exams
          </h3>
          <div className="text-center py-8">
            <div className="text-secondary mb-2">
              <svg
                className="w-12 h-12 mx-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-secondary">No upcoming exams scheduled</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Recent Activity
          </h3>
          <div className="text-center py-8">
            <div className="text-secondary mb-2">
              <svg
                className="w-12 h-12 mx-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-secondary">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  )
}
