import EmailVerificationHandler from '@/components/auth/EmailVerificationHandler'
import Card from '@/components/ui/Card'
import Link from 'next/link'

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

        <EmailVerificationHandler />

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
