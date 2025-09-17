export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface SendEmailParams {
  from: string
  to: string
  subject: string
  html?: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string | string[]
}

export interface SendInvitationEmailParams {
  email: string
  token: string
  inviterName?: string
  recipientName?: string
  institutionName?: string
}

export interface EmailProvider {
  /**
   * Send a generic email
   */
  sendEmail(params: SendEmailParams): Promise<EmailResult>

  /**
   * Send an invitation email with pre-formatted template
   */
  sendInvitationEmail(params: SendInvitationEmailParams): Promise<EmailResult>

  /**
   * Send a password reset email
   */
  sendPasswordResetEmail(email: string, resetUrl: string): Promise<EmailResult>

  /**
   * Check if the provider is properly configured and ready to send emails
   */
  isConfigured(): boolean

  /**
   * Get the name/type of this email provider
   */
  getProviderName(): string
}

export type EmailProviderType = 'resend' | 'smtp' | 'ses' | 'none'
