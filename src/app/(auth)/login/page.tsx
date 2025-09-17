import LoginForm from '@/components/auth/LoginForm'
import Card from '@/components/ui/Card'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <Card className="shadow-md">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Sign in</h2>
          <p className="mt-2 text-sm text-secondary">
            Enter your credentials to access your account
          </p>
        </div>

        <LoginForm />

        <div className="text-center">
          <p className="text-sm text-secondary">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-primary hover:text-primary-hover"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </Card>
  )
}
