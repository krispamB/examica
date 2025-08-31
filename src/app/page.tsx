'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState(
    'Testing connection...'
  )
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.getSession()
        if (error) {
          setConnectionError(error.message)
          setConnectionStatus('Connection failed')
        } else {
          setConnectionStatus('Connected to Supabase successfully!')
        }
      } catch (err) {
        setConnectionError(err instanceof Error ? err.message : 'Unknown error')
        setConnectionStatus('Connection failed')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-center sm:text-left">
          Welcome to Examica
        </h1>
        <p className="text-lg text-secondary text-center sm:text-left">
          Computer-Based Testing Platform with AI Integration
        </p>

        <div className="bg-background-secondary p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-2">
            Supabase Integration Status
          </h2>
          <p
            className={`font-mono text-sm ${connectionError ? 'text-error' : 'text-success'}`}
          >
            {connectionStatus}
          </p>
          {connectionError && (
            <details className="mt-2">
              <summary className="cursor-pointer text-error text-sm">
                View Error Details
              </summary>
              <pre className="mt-1 text-xs text-error bg-error-light p-2 rounded">
                {connectionError}
              </pre>
            </details>
          )}
        </div>

        <div className="bg-primary-light p-6 rounded-lg border border-primary/20 mb-6">
          <h2 className="text-lg font-semibold text-primary mb-2">
            Section 1.2 - Supabase Integration ✅
          </h2>
          <ul className="text-sm text-primary space-y-1">
            <li>✅ Supabase client libraries installed</li>
            <li>✅ Environment variables configured</li>
            <li>✅ Client configuration files created</li>
            <li>✅ Authentication middleware setup</li>
            <li>✅ TypeScript types generated</li>
            <li>✅ Database connection tested</li>
          </ul>
        </div>

        <div className="bg-success-light p-6 rounded-lg border border-success/20">
          <h2 className="text-lg font-semibold text-success mb-2">
            Section 1.3 - Project Structure ✅
          </h2>
          <ul className="text-sm text-success space-y-1">
            <li>
              ✅ Complete folder structure created (/components, /hooks, /types,
              /lib)
            </li>
            <li>✅ Role-based App Router structure implemented</li>
            <li>✅ Authentication middleware enhanced with route protection</li>
            <li>✅ Base layout components built (Header, Sidebar, Footer)</li>
            <li>✅ UI components library started (Button, Input, Card)</li>
            <li>✅ Global styles and theme configuration setup</li>
            <li>✅ Auth layouts and forms created</li>
            <li>✅ Role-specific dashboards implemented</li>
          </ul>
        </div>

        <div className="bg-warning-light p-6 rounded-lg border border-warning/20">
          <h2 className="text-lg font-semibold text-warning mb-2">
            Next: Section 2.1 - Database Schema Design 🚀
          </h2>
          <ul className="text-sm text-warning space-y-1">
            <li>⏳ Design users table with role-based fields</li>
            <li>⏳ Create user_profiles table for extended information</li>
            <li>⏳ Design facial_verifications table for biometric data</li>
            <li>⏳ Set up Row Level Security (RLS) policies</li>
            <li>⏳ Create database migrations</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
