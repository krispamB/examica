import type { EmailProvider, EmailProviderType } from './providers/types'
import { ResendProvider } from './providers/resend'
import { SMTPProvider } from './providers/smtp'
import { SESEmailProvider } from './providers/ses'
import { NoOpProvider } from './providers/noop'

// Re-export types for backwards compatibility
export type { EmailResult, SendInvitationEmailParams } from './providers/types'

let emailProvider: EmailProvider | null = null

function getEmailProviderType(): EmailProviderType {
  const providerType =
    process.env.EMAIL_PROVIDER?.toLowerCase() as EmailProviderType

  // Auto-detect provider if not explicitly set
  if (!providerType) {
    if (process.env.RESEND_API_KEY) {
      return 'resend'
    }
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      return 'ses'
    }
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      return 'smtp'
    }
    return 'none'
  }

  // Validate explicit provider type
  if (!['resend', 'smtp', 'ses', 'none'].includes(providerType)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `Invalid EMAIL_PROVIDER: ${providerType}, falling back to 'none'`
      )
    }
    return 'none'
  }

  return providerType
}

async function getEmailProvider(): Promise<EmailProvider> {
  if (emailProvider) {
    return emailProvider
  }

  const providerType = getEmailProviderType()

  if (process.env.NODE_ENV === 'development') {
    console.log(`Initializing email provider: ${providerType}`)
  }

  switch (providerType) {
    case 'resend':
      emailProvider = new ResendProvider()
      break
    case 'smtp':
      emailProvider = new SMTPProvider()
      break
    case 'ses':
      emailProvider = new SESEmailProvider()
      break
    case 'none':
    default:
      emailProvider = new NoOpProvider()
      break
  }

  // Log provider status
  if (emailProvider.isConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `Email provider '${emailProvider.getProviderName()}' initialized successfully`
      )
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `Email provider '${emailProvider.getProviderName()}' failed to initialize, falling back to no-op`
      )
    }
    emailProvider = new NoOpProvider()
  }

  return emailProvider
}

/**
 * Send an invitation email using the configured email provider
 */
export async function sendInvitationEmail(
  params: Parameters<EmailProvider['sendInvitationEmail']>[0]
): Promise<Awaited<ReturnType<EmailProvider['sendInvitationEmail']>>> {
  const provider = await getEmailProvider()
  return provider.sendInvitationEmail(params)
}

/**
 * Send a password reset email using the configured email provider
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<Awaited<ReturnType<EmailProvider['sendPasswordResetEmail']>>> {
  const provider = await getEmailProvider()
  return provider.sendPasswordResetEmail(email, resetUrl)
}

/**
 * Get information about the current email provider
 */
export async function getEmailProviderInfo(): Promise<{
  providerName: string
  isConfigured: boolean
  providerType: EmailProviderType
}> {
  const provider = await getEmailProvider()
  return {
    providerName: provider.getProviderName(),
    isConfigured: provider.isConfigured(),
    providerType: getEmailProviderType(),
  }
}
