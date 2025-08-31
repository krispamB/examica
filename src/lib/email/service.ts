import { Resend } from 'resend'

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY!)

export interface SendInvitationEmailParams {
  email: string
  token: string
  inviterName?: string
  recipientName?: string
  institutionName?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<EmailResult> {
  try {
    // Construct the invitation acceptance URL
    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${params.token}`

    // Format recipient name
    const recipientName = params.recipientName || 'there'
    const inviterName = params.inviterName || 'someone'
    const institutionName = params.institutionName || 'an organization'

    const { data, error } = await resend.emails.send({
      from: 'Examica <onboarding@resend.dev>',
      to: [params.email],
      subject: `You've been invited to join ${institutionName} on Examica`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Invitation to Examica</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
              border-radius: 8px 8px 0 0; 
            }
            .content { 
              background: #ffffff; 
              padding: 30px 20px; 
              border: 1px solid #e1e8ed; 
              border-top: none; 
            }
            .button { 
              display: inline-block; 
              background: #667eea; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0; 
              font-weight: 500; 
            }
            .button:hover { background: #5a6fd8; }
            .footer { 
              background: #f8f9fa; 
              padding: 20px; 
              text-align: center; 
              font-size: 14px; 
              color: #6c757d; 
              border-radius: 0 0 8px 8px; 
              border: 1px solid #e1e8ed; 
              border-top: none; 
            }
            .warning { 
              background: #fff3cd; 
              border: 1px solid #ffeaa7; 
              padding: 15px; 
              border-radius: 6px; 
              margin: 20px 0; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎓 Welcome to Examica</h1>
            <p>Computer-Based Testing Platform</p>
          </div>
          
          <div class="content">
            <h2>You've been invited!</h2>
            <p>Hi ${recipientName},</p>
            <p>${inviterName} has invited you to join <strong>${institutionName}</strong> on Examica, our secure computer-based testing platform.</p>
            
            <p>Click the button below to accept your invitation and set up your account:</p>
            
            <div style="text-align: center;">
              <a href="${acceptUrl}" class="button">Accept Invitation</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">${acceptUrl}</p>
            
            <div class="warning">
              <strong>⏰ Important:</strong> This invitation will expire in 7 days. Please accept it as soon as possible.
            </div>
          </div>
          
          <div class="footer">
            <p>This email was sent by Examica. If you didn't expect this invitation, you can safely ignore this email.</p>
            <p>Questions? Contact your institution administrator.</p>
          </div>
        </body>
        </html>
      `,
      // Plain text version for email clients that don't support HTML
      text: `
You've been invited to join ${institutionName} on Examica!

${inviterName} has sent you an invitation to join their organization on Examica, our secure computer-based testing platform.

To accept your invitation, click this link or copy it into your browser:
${acceptUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
      `,
    })

    if (error) {
      console.error('Resend API error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email',
      }
    }

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    console.error('Email service error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Examica <onboarding@resend.dev>',
      to: [email],
      subject: 'Reset your Examica password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 500; }
          </style>
        </head>
        <body>
          <h1>🔒 Password Reset Request</h1>
          <p>You requested to reset your password for your Examica account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link: ${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this reset, you can safely ignore this email.</p>
        </body>
        </html>
      `,
      text: `
You requested to reset your password for your Examica account.

Click this link to reset your password: ${resetUrl}

This link will expire in 1 hour.

If you didn't request this reset, you can safely ignore this email.
      `,
    })

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to send password reset email',
      }
    }

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
