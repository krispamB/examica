export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Examica</h1>
          <p className="mt-2 text-sm text-secondary">
            Computer-Based Testing Platform
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
