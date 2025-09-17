import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEmailProviderInfo } from '@/lib/email/service'

export async function GET() {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get email provider information
    const emailInfo = await getEmailProviderInfo()

    return NextResponse.json({
      success: true,
      email: {
        provider: emailInfo.providerName,
        type: emailInfo.providerType,
        configured: emailInfo.isConfigured,
        environment: {
          EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'auto-detected',
          hasResendKey: !!process.env.RESEND_API_KEY,
          hasSMTPConfig: !!(
            process.env.SMTP_HOST &&
            process.env.SMTP_PORT &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASS
          ),
          emailFrom: process.env.EMAIL_FROM || 'not configured',
        },
      },
    })
  } catch (error) {
    console.error('Email status API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
