'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useUserRole } from '@/hooks/useUser'
import { UserRole } from '@/types/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredRoles?: UserRole[]
  redirectTo?: string
  allowUnauthenticated?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredRoles,
  redirectTo,
  allowUnauthenticated = false,
}) => {
  const { isAuthenticated, isLoading } = useUser()
  const { role, hasRole, hasAnyRole } = useUserRole()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return

    // If authentication is required but user is not authenticated
    if (!allowUnauthenticated && !isAuthenticated) {
      router.push(redirectTo || '/login')
      return
    }

    // If user is authenticated, check role requirements
    if (isAuthenticated) {
      // Check single required role
      if (requiredRole && !hasRole(requiredRole)) {
        const defaultPath = getDefaultRedirectPath(role)
        router.push(redirectTo || defaultPath)
        return
      }

      // Check multiple required roles
      if (
        requiredRoles &&
        requiredRoles.length > 0 &&
        !hasAnyRole(requiredRoles)
      ) {
        const defaultPath = getDefaultRedirectPath(role)
        router.push(redirectTo || defaultPath)
        return
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    role,
    requiredRole,
    requiredRoles,
    redirectTo,
    allowUnauthenticated,
    router,
    hasRole,
    hasAnyRole,
  ])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render children until authentication check is complete
  if (!allowUnauthenticated && !isAuthenticated) {
    return null
  }

  // Check role requirements before rendering
  if (isAuthenticated) {
    if (requiredRole && !hasRole(requiredRole)) {
      return null
    }

    if (
      requiredRoles &&
      requiredRoles.length > 0 &&
      !hasAnyRole(requiredRoles)
    ) {
      return null
    }
  }

  return <>{children}</>
}

// Helper function to get default redirect path based on role
function getDefaultRedirectPath(role: UserRole | null): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'examiner':
      return '/examiner'
    case 'student':
      return '/student'
    default:
      return '/login'
  }
}

export default ProtectedRoute

// Convenience components for specific roles
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>

export const ExaminerRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <ProtectedRoute requiredRole="examiner">{children}</ProtectedRoute>

export const StudentRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <ProtectedRoute requiredRole="student">{children}</ProtectedRoute>

export const StaffRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ProtectedRoute requiredRoles={['admin', 'examiner']}>
    {children}
  </ProtectedRoute>
)
