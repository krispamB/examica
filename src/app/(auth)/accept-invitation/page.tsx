import InvitationAcceptanceForm from '@/components/auth/InvitationAcceptanceForm'
import Card from '@/components/ui/Card'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AcceptInvitationPage() {
  return (
    <Card className="shadow-md">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Accept Invitation
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Complete your account setup to join your institution
          </p>
        </div>

        <InvitationAcceptanceForm />

        <div className="text-center">
          <p className="text-sm text-secondary">
            Already have an account?{' '}
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
