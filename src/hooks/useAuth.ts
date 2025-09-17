'use client'

import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types/auth'
import { Tables } from '@/types/database.types'

type UserProfile = Tables<'user_profiles'>

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    userData: {
      first_name: string
      last_name: string
      role: UserRole
    }
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updateProfile: (
    updates: Partial<UserProfile>
  ) => Promise<{ error: string | null }>
}

export function useAuth(): AuthState & AuthActions {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  })

  const supabase = createClient()

  // Fetch user profile when user changes
  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error('Error fetching profile:', error)
        return null
      }
    },
    [supabase]
  )

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          setAuthState({
            user: session.user,
            profile,
            loading: false,
            error: null,
          })
        } else {
          setAuthState((prev) => ({
            ...prev,
            user: null,
            profile: null,
            loading: false,
          }))
        }
      } catch (error) {
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        }))
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setAuthState({
          user: session.user,
          profile,
          loading: false,
          error: null,
        })
      } else {
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, supabase])

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed'
      setAuthState((prev) => ({ ...prev, loading: false, error: message }))
      return { error: message }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    userData: { first_name: string; last_name: string; role: UserRole }
  ) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
          },
        },
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed'
      setAuthState((prev) => ({ ...prev, loading: false, error: message }))
      return { error: message }
    }
  }

  const signOut = async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }))

      const { error } = await supabase.auth.signOut()

      if (error) throw error

      return { error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed'
      setAuthState((prev) => ({ ...prev, error: message }))
      return { error: message }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Password reset failed'
      return { error: message }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authState.user) {
      return { error: 'No user logged in' }
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authState.user.id)

      if (error) throw error

      // Refresh profile
      const updatedProfile = await fetchProfile(authState.user.id)
      setAuthState((prev) => ({
        ...prev,
        profile: updatedProfile,
      }))

      return { error: null }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Profile update failed'
      return { error: message }
    }
  }

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  }
}
