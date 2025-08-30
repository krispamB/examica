import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'
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

  // For now, we'll simulate user role - in real implementation, this would come from the database
  // TODO: Implement actual role fetching from user profile in database
  let userRole: UserRole | null = null

  if (user) {
    // This is a placeholder - in real implementation, fetch from user profile
    // For now, we'll determine role based on email domain or other logic
    const email = user.email || ''
    if (email.includes('admin')) {
      userRole = 'admin'
    } else if (email.includes('examiner') || email.includes('staff')) {
      userRole = 'examiner'
    } else {
      userRole = 'student'
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
