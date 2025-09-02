// AWS Rekognition related types and interfaces

export interface AWSCredentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
}

export interface FaceComparisonResult {
  similarity: number
  confidence: number
  success: boolean
  error?: string
}

export interface FaceDetectionResult {
  faceDetected: boolean
  confidence: number
  boundingBox?: {
    left: number
    top: number
    width: number
    height: number
  }
  error?: string
}

export interface RekognitionError {
  code: string
  message: string
  retryable: boolean
}

export interface ComparisonMetrics {
  similarity: number
  confidence: number
  faceMatches: number
  timestamp: string
}