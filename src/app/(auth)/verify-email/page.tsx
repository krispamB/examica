import { Suspense } from 'react'
import EmailVerificationHandler from '@/components/auth/EmailVerificationHandler'
import Card from '@/components/ui/Card'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function VerificationFallback() {
  return (
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="text-secondary">Loading verification...</p>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Card className="shadow-md">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Email Verification
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Verifying your email address...
          </p>
        </div>

        <Suspense fallback={<VerificationFallback />}>
          <EmailVerificationHandler />
        </Suspense>

        <div className="text-center">
          <p className="text-sm text-secondary">
            Need help?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary-hover"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </Card>
  )
}
