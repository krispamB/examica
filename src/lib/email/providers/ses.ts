import type {
  EmailProvider,
  SendEmailParams,
  EmailResult,
  SendInvitationEmailParams,
} from './types'

export class SESEmailProvider implements EmailProvider {
  private ses: {
    send: (command: {
      Source: string
      Destination: object
      Message: object
      ReplyToAddresses?: string[]
    }) => Promise<{ MessageId?: string }>
  } | null = null
  private configured = false
  private configurationChecked = false
  private initializationPromise: Promise<void> | null = null
  private region: string
  private accessKeyId?: string
  private secretAccessKey?: string

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1'
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

    // Check configuration immediately (synchronously)
    this.checkConfiguration()
  }

  private checkConfiguration() {
    if (this.configurationChecked) return

    this.configurationChecked = true

    // Check if AWS credentials are available
    if (!this.accessKeyId || !this.secretAccessKey) {
      console.warn(
        'AWS credentials not found - SES provider disabled. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.'
      )
      this.configured = false
      return
    }

    // Credentials are available, mark as configured but don't initialize AWS SDK yet
    this.configured = true
  }

  private async ensureInitialized() {
    if (!this.configured) {
      throw new Error('SES provider not configured')
    }

    if (this.ses) {
      return // Already initialized
    }

    if (this.initializationPromise) {
      await this.initializationPromise
      return
    }

    this.initializationPromise = this.initializeSES()
    await this.initializationPromise
  }

  private async initializeSES() {
    try {
      // Dynamic import to avoid loading AWS SDK if not configured
      const { SESClient } = await import('@aws-sdk/client-ses')

      this.ses = new SESClient({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId!,
          secretAccessKey: this.secretAccessKey!,
        },
      }) as any

      console.log(
        `SES provider initialized successfully in region: ${this.region}`
      )
    } catch (error) {
      console.error('Failed to initialize SES provider:', error)
      this.configured = false
      throw error
    }
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      await this.ensureInitialized()

      const { SendEmailCommand } = await import('@aws-sdk/client-ses')

      const command = new SendEmailCommand({
        Source: params.from,
        Destination: {
          ToAddresses: [params.to],
          ...(params.cc && {
            CcAddresses: Array.isArray(params.cc) ? params.cc : [params.cc],
          }),
          ...(params.bcc && {
            BccAddresses: Array.isArray(params.bcc) ? params.bcc : [params.bcc],
          }),
        },
        Message: {
          Subject: {
            Data: params.subject,
            Charset: 'UTF-8',
          },
          Body: params.html
            ? {
                Html: {
                  Data: params.html,
                  Charset: 'UTF-8',
                },
                ...(params.text && {
                  Text: {
                    Data: params.text,
                    Charset: 'UTF-8',
                  },
                }),
              }
            : {
                Text: {
                  Data: params.text || params.subject,
                  Charset: 'UTF-8',
                },
              },
        },
        ...(params.replyTo && {
          ReplyToAddresses: Array.isArray(params.replyTo)
            ? params.replyTo
            : [params.replyTo],
        }),
      })

      const result = await (this.ses as any).send(command)

      return {
        success: true,
        messageId: result.MessageId,
      }
    } catch (error) {
      console.error('SES send email error:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send email via SES',
      }
    }
  }

  async sendInvitationEmail(
    params: SendInvitationEmailParams
  ): Promise<EmailResult> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/accept-invitation?token=${params.token}`
    const institutionName = params.institutionName || 'Examica Institution'

    const subject = `Invitation to join ${institutionName}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border: 1px solid #e9ecef;">
            <h1 style="color: #007bff; margin-bottom: 20px; text-align: center;">Welcome to ${institutionName}!</h1>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${params.recipientName ? `Hi ${params.recipientName},` : 'Hello,'}
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${params.inviterName} has invited you to join ${institutionName} on our examination platform.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #007bff; word-break: break-all;">
              ${invitationUrl}
            </p>
            
            <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
              This invitation will expire in 7 days. If you have any questions, please contact your administrator.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            <p style="font-size: 12px; color: #6c757d; text-align: center;">
              This email was sent from ${institutionName}'s examination platform.
            </p>
          </div>
        </body>
      </html>
    `

    const text = `
Welcome to ${institutionName}!

${params.recipientName ? `Hi ${params.recipientName},` : 'Hello,'}

${params.inviterName} has invited you to join ${institutionName} on our examination platform.

To accept this invitation, please visit: ${invitationUrl}

This invitation will expire in 7 days. If you have any questions, please contact your administrator.

---
This email was sent from ${institutionName}'s examination platform.
    `

    return this.sendEmail({
      from:
        process.env.EMAIL_FROM ||
        `noreply@${institutionName.toLowerCase().replace(/\s+/g, '')}.com`,
      to: params.email,
      subject,
      html,
      text,
    })
  }

  async sendPasswordResetEmail(
    email: string,
    resetUrl: string
  ): Promise<EmailResult> {
    const institutionName =
      process.env.INSTITUTION_NAME || 'Examica Institution'
    const subject = 'Password Reset Request'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border: 1px solid #e9ecef;">
            <h1 style="color: #dc3545; margin-bottom: 20px; text-align: center;">Password Reset Request</h1>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We received a request to reset your password for your ${institutionName} account.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background-color: #dc3545; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #dc3545; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
              If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
            
            <p style="font-size: 14px; color: #6c757d;">
              This link will expire in 24 hours for security reasons.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            <p style="font-size: 12px; color: #6c757d; text-align: center;">
              This email was sent from ${institutionName}'s examination platform.
            </p>
          </div>
        </body>
      </html>
    `

    const text = `
Password Reset Request

We received a request to reset your password for your ${institutionName} account.

To reset your password, please visit: ${resetUrl}

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

This link will expire in 24 hours for security reasons.

---
This email was sent from ${institutionName}'s examination platform.
    `

    return this.sendEmail({
      from:
        process.env.EMAIL_FROM ||
        `noreply@${institutionName.toLowerCase().replace(/\s+/g, '')}.com`,
      to: email,
      subject,
      html,
      text,
    })
  }

  isConfigured(): boolean {
    return this.configured
  }

  getProviderName(): string {
    return 'Amazon SES'
  }
}

export default SESEmailProvider
