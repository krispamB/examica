export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Dashboard Overview
        </h2>
        <p className="mt-2 text-secondary">
          Welcome to the Examica administration panel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground">Total Users</h3>
          <p className="mt-2 text-3xl font-bold text-primary">0</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Active Exams
          </h3>
          <p className="mt-2 text-3xl font-bold text-success">0</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Completed Exams
          </h3>
          <p className="mt-2 text-3xl font-bold text-secondary">0</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground">
            System Health
          </h3>
          <p className="mt-2 text-3xl font-bold text-success">Good</p>
        </div>
      </div>
    </div>
  )
}
