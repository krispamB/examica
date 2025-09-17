import { Suspense } from 'react'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import Card from '@/components/ui/Card'
import Link from 'next/link'

function ResetPasswordContent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}

export default function ResetPasswordPage() {
  return (
    <Card className="shadow-md">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Set new password
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Enter your new password below
          </p>
        </div>

        <ResetPasswordContent />

        <div className="text-center">
          <p className="text-sm text-secondary">
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary-hover"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </Card>
  )
}
