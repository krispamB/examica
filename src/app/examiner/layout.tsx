import DashboardLayout from '@/components/common/DashboardLayout'

export default function ExaminerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout role="examiner">{children}</DashboardLayout>
}
