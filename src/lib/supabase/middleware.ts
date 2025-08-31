import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'
import type { UserRole } from '@/types/auth'
import {
  canAccessRoute,
  shouldRedirectAuth,
  getDefaultRedirectPath,
} from '@/lib/auth'

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Fetch user role from user_profiles table
  let userRole: UserRole | null = null

  if (user) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      userRole = profile?.role || null
    } catch (error) {
      console.error('Error fetching user role:', error)
      // If we can't fetch the role, default to null (will redirect to login)
      userRole = null
    }
  }

  // Handle authentication redirects
  if (shouldRedirectAuth(userRole, pathname)) {
    const redirectPath = getDefaultRedirectPath(userRole!)
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Handle protected routes
  if (!canAccessRoute(userRole, pathname)) {
    // If user is not authenticated and trying to access protected route
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // If user is authenticated but doesn't have permission for this route
    const redirectPath = getDefaultRedirectPath(userRole!)
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  return supabaseResponse
}
