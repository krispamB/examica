import type {
  EmailProvider,
  EmailResult,
  SendEmailParams,
  SendInvitationEmailParams,
} from './types'

export class NoOpProvider implements EmailProvider {
  isConfigured(): boolean {
    return true // Always "configured" since it's a no-op
  }

  getProviderName(): string {
    return 'none'
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    console.log('Email sending disabled - no-op provider active')
    console.log(
      `Would send email to ${params.to} with subject "${params.subject}" from ${params.from}`
    )
    return {
      success: true,
      messageId: 'noop-' + Date.now(),
    }
  }

  async sendInvitationEmail(
    params: SendInvitationEmailParams
  ): Promise<EmailResult> {
    console.log(
      `Would send invitation email to ${params.email} with token ${params.token} (email sending disabled)`
    )
    return {
      success: true,
      messageId: 'noop-invitation-' + Date.now(),
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetUrl: string
  ): Promise<EmailResult> {
    console.log(
      `Would send password reset email to ${email} with URL ${resetUrl} (email sending disabled)`
    )
    return {
      success: true,
      messageId: 'noop-reset-' + Date.now(),
    }
  }
}
