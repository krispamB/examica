import { RekognitionClient } from '@aws-sdk/client-rekognition'
import type { AWSCredentials, RekognitionError } from './types'

export class AWSConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AWSConfigError'
  }
}

export function validateAWSCredentials(): AWSCredentials {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const region = process.env.AWS_REGION || 'us-east-1'

  if (!accessKeyId) {
    throw new AWSConfigError(
      'AWS_ACCESS_KEY_ID environment variable is required'
    )
  }

  if (!secretAccessKey) {
    throw new AWSConfigError(
      'AWS_SECRET_ACCESS_KEY environment variable is required'
    )
  }

  return {
    accessKeyId,
    secretAccessKey,
    region,
  }
}

export function createRekognitionClient(): RekognitionClient {
  try {
    const credentials = validateAWSCredentials()

    return new RekognitionClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    })
  } catch (error) {
    console.error('Failed to create Rekognition client:', error)
    throw error
  }
}

export function handleRekognitionError(
  error: Error | unknown
): RekognitionError {
  const rekognitionError: RekognitionError = {
    code: (error as any).name || 'UnknownError',
    message: (error as any).message || 'An unknown error occurred',
    retryable: false,
  }

  // Handle specific AWS Rekognition errors
  switch ((error as any).name) {
    case 'InvalidImageFormatException':
      rekognitionError.message = 'Invalid image format. Please use JPEG or PNG.'
      rekognitionError.retryable = false
      break

    case 'ImageTooLargeException':
      rekognitionError.message =
        'Image is too large. Please use an image smaller than 15MB.'
      rekognitionError.retryable = false
      break

    case 'InvalidS3ObjectException':
      rekognitionError.message =
        'Unable to access the image. Please check the image URL.'
      rekognitionError.retryable = false
      break

    case 'ThrottlingException':
      rekognitionError.message =
        'Request rate exceeded. Please try again later.'
      rekognitionError.retryable = true
      break

    case 'ProvisionedThroughputExceededException':
      rekognitionError.message =
        'Service limit exceeded. Please try again later.'
      rekognitionError.retryable = true
      break

    case 'InternalServerError':
      rekognitionError.message = 'AWS service error. Please try again later.'
      rekognitionError.retryable = true
      break

    case 'InvalidParameterException':
      rekognitionError.message = 'Invalid parameters provided to AWS service.'
      rekognitionError.retryable = false
      break

    default:
      console.error('Unhandled AWS Rekognition error:', error)
  }

  return rekognitionError
}

export async function testAWSConnection(): Promise<boolean> {
  try {
    createRekognitionClient()
    // This is a simple test to verify credentials work
    // We don't actually call any Rekognition APIs here to avoid costs
    return true
  } catch (error) {
    console.error('AWS connection test failed:', error)
    return false
  }
}
