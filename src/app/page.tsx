import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  let connectionStatus = 'Testing connection...'
  let connectionError = null

  try {
    const { error } = await supabase.auth.getSession()
    if (error) {
      connectionError = error.message
      connectionStatus = 'Connection failed'
    } else {
      connectionStatus = 'Connected to Supabase successfully!'
    }
  } catch (err) {
    connectionError = err instanceof Error ? err.message : 'Unknown error'
    connectionStatus = 'Connection failed'
  }

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-center sm:text-left">
          Welcome to Examica
        </h1>
        <p className="text-lg text-gray-600 text-center sm:text-left">
          Computer-Based Testing Platform with AI Integration
        </p>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">
            Supabase Integration Status
          </h2>
          <p
            className={`font-mono text-sm ${connectionError ? 'text-red-600' : 'text-green-600'}`}
          >
            {connectionStatus}
          </p>
          {connectionError && (
            <details className="mt-2">
              <summary className="cursor-pointer text-red-500 text-sm">
                View Error Details
              </summary>
              <pre className="mt-1 text-xs text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {connectionError}
              </pre>
            </details>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Section 1.2 - Supabase Integration ✅
          </h2>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>✅ Supabase client libraries installed</li>
            <li>✅ Environment variables configured</li>
            <li>✅ Client configuration files created</li>
            <li>✅ Authentication middleware setup</li>
            <li>✅ TypeScript types generated</li>
            <li>✅ Database connection tested</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
