import DashboardLayout from '@/components/common/DashboardLayout'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout role="student">{children}</DashboardLayout>
}
