'use client'

import { useAuth } from './useAuth'
import { UserRole } from '@/types/auth'
import { Tables } from '@/types/database.types'

type UserProfile = Tables<'user_profiles'>

interface UserData {
  id: string | undefined
  email: string | undefined
  profile: UserProfile | null
  role: UserRole | null
  fullName: string
  isAuthenticated: boolean
  isLoading: boolean
}

export function useUser(): UserData {
  const { user, profile, loading } = useAuth()

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : ''

  return {
    id: user?.id,
    email: user?.email,
    profile,
    role: profile?.role || null,
    fullName,
    isAuthenticated: !!user,
    isLoading: loading,
  }
}

// Utility hook to check if user has specific role
export function useUserRole() {
  const { role } = useUser()

  const hasRole = (requiredRole: UserRole) => role === requiredRole

  const hasAnyRole = (roles: UserRole[]) =>
    role ? roles.includes(role) : false

  const isAdmin = () => role === 'admin'
  const isExaminer = () => role === 'examiner'
  const isStudent = () => role === 'student'

  return {
    role,
    hasRole,
    hasAnyRole,
    isAdmin,
    isExaminer,
    isStudent,
  }
}
