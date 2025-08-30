import { type UserRole } from '@/types/auth'

export const ROLE_ROUTES: Record<UserRole, string[]> = {
  admin: ['/admin'],
  examiner: ['/examiner'],
  student: ['/student'],
}

export const PUBLIC_ROUTES = ['/', '/login', '/register', '/about', '/contact']

export const AUTH_ROUTES = ['/login', '/register']

export function getDefaultRedirectPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'examiner':
      return '/examiner'
    case 'student':
      return '/student'
    default:
      return '/'
  }
}

export function canAccessRoute(
  userRole: UserRole | null,
  pathname: string
): boolean {
  // Allow access to public routes
  if (
    PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    )
  ) {
    return true
  }

  // Deny access if no user role
  if (!userRole) {
    return false
  }

  // Check if user can access their role-specific routes
  const userRoutes = ROLE_ROUTES[userRole]
  return userRoutes.some((route) => pathname.startsWith(route))
}

export function shouldRedirectAuth(
  userRole: UserRole | null,
  pathname: string
): boolean {
  // If user is logged in and trying to access auth routes, redirect them
  if (userRole && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return true
  }
  return false
}
