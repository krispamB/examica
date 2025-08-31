import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import Card from '@/components/ui/Card'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <Card className="shadow-md">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Enter your email address and we&apos;ll send you a link to reset
            your password
          </p>
        </div>

        <ForgotPasswordForm />

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
