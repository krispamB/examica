import { redirect } from 'next/navigation'

export default function RegisterPage() {
  // Redirect to login since public registration is disabled
  redirect('/login')
}
