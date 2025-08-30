export type UserRole = 'admin' | 'examiner' | 'student'

export interface User {
  id: string
  email: string
  role: UserRole
  profile?: UserProfile
}

export interface UserProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}
