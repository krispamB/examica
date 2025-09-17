import { CompareFacesCommand, DetectFacesCommand } from '@aws-sdk/client-rekognition'
import { createRekognitionClient, handleRekognitionError } from './config'
import type { FaceComparisonResult, FaceDetectionResult } from './types'

export const SIMILARITY_THRESHOLD = 80 // 80% similarity threshold
export const CONFIDENCE_THRESHOLD = 90 // 90% confidence threshold for face detection

export class RekognitionService {
  private client

  constructor() {
    this.client = createRekognitionClient()
  }

  /**
   * Compare two face images using AWS Rekognition
   * @param sourceImageBase64 - Base64 encoded source image (stored reference image)
   * @param targetImageBase64 - Base64 encoded target image (live capture)
   * @returns Face comparison result with similarity score
   */
  async compareFaces(
    sourceImageBase64: string,
    targetImageBase64: string
  ): Promise<FaceComparisonResult> {
    try {
      // Convert base64 to buffer
      const sourceBuffer = Buffer.from(sourceImageBase64, 'base64')
      const targetBuffer = Buffer.from(targetImageBase64, 'base64')

      const command = new CompareFacesCommand({
        SourceImage: {
          Bytes: sourceBuffer,
        },
        TargetImage: {
          Bytes: targetBuffer,
        },
        SimilarityThreshold: SIMILARITY_THRESHOLD,
      })

      const response = await this.client.send(command)

      // Check if faces were found and matched
      if (!response.FaceMatches || response.FaceMatches.length === 0) {
        // Check if there are unmatched faces (faces detected but not matching)
        const hasUnmatchedFaces = response.UnmatchedFaces && response.UnmatchedFaces.length > 0
        const hasSourceFace = response.SourceImageFace
        
        let errorMessage = 'No matching faces found'
        if (!hasSourceFace) {
          errorMessage = 'No face detected in the reference image'
        } else if (!hasUnmatchedFaces) {
          errorMessage = 'No face detected in the captured image'
        }

        return {
          similarity: 0,
          confidence: hasSourceFace?.Confidence || 0,
          success: false,
          error: errorMessage,
        }
      }

      // Get the best match (highest similarity)
      const bestMatch = response.FaceMatches[0]
      const similarity = bestMatch.Similarity || 0
      const confidence = bestMatch.Face?.Confidence || 0

      return {
        similarity: Math.round(similarity * 100) / 100, // Round to 2 decimal places
        confidence: Math.round(confidence * 100) / 100,
        success: similarity >= SIMILARITY_THRESHOLD,
      }
    } catch (error) {
      const rekognitionError = handleRekognitionError(error)
      return {
        similarity: 0,
        confidence: 0,
        success: false,
        error: rekognitionError.message,
      }
    }
  }

  /**
   * Detect faces in an image to validate image quality
   * @param imageBase64 - Base64 encoded image
   * @returns Face detection result
   */
  async detectFaces(imageBase64: string): Promise<FaceDetectionResult> {
    try {
      const imageBuffer = Buffer.from(imageBase64, 'base64')

      const command = new DetectFacesCommand({
        Image: {
          Bytes: imageBuffer,
        },
        Attributes: ['DEFAULT'], // Get basic face attributes
      })

      const response = await this.client.send(command)

      if (!response.FaceDetails || response.FaceDetails.length === 0) {
        return {
          faceDetected: false,
          confidence: 0,
          error: 'No face detected in the image',
        }
      }

      // Get the most confident face
      const primaryFace = response.FaceDetails[0]
      const confidence = primaryFace.Confidence || 0

      // Check if confidence meets our threshold
      if (confidence < CONFIDENCE_THRESHOLD) {
        return {
          faceDetected: false,
          confidence,
          error: `Face detection confidence too low: ${confidence.toFixed(1)}%`,
        }
      }

      // Extract bounding box if available
      const boundingBox = primaryFace.BoundingBox
        ? {
            left: primaryFace.BoundingBox.Left || 0,
            top: primaryFace.BoundingBox.Top || 0,
            width: primaryFace.BoundingBox.Width || 0,
            height: primaryFace.BoundingBox.Height || 0,
          }
        : undefined

      return {
        faceDetected: true,
        confidence: Math.round(confidence * 100) / 100,
        boundingBox,
      }
    } catch (error) {
      const rekognitionError = handleRekognitionError(error)
      return {
        faceDetected: false,
        confidence: 0,
        error: rekognitionError.message,
      }
    }
  }

  /**
   * Validate that an image contains a suitable face for recognition
   * This is useful for validating uploaded reference images
   */
  async validateFaceImage(imageBase64: string): Promise<{
    valid: boolean
    confidence?: number
    issues: string[]
  }> {
    const issues: string[] = []
    
    try {
      const detection = await this.detectFaces(imageBase64)
      
      if (!detection.faceDetected) {
        issues.push(detection.error || 'No face detected')
        return { valid: false, issues }
      }

      const confidence = detection.confidence

      // Check confidence level
      if (confidence < CONFIDENCE_THRESHOLD) {
        issues.push(`Face detection confidence too low (${confidence.toFixed(1)}%)`)
      }

      // Check bounding box size (face should be reasonably large in image)
      if (detection.boundingBox) {
        const faceArea = detection.boundingBox.width * detection.boundingBox.height
        if (faceArea < 0.05) { // Face should be at least 5% of image
          issues.push('Face appears too small in the image')
        }
        if (faceArea > 0.8) { // Face shouldn't take up more than 80% of image
          issues.push('Face appears too large in the image')
        }
      }

      return {
        valid: issues.length === 0,
        confidence,
        issues,
      }
    } catch (error) {
      const rekognitionError = handleRekognitionError(error)
      issues.push(rekognitionError.message)
      return { valid: false, issues }
    }
  }
}

// Singleton instance for reuse
let rekognitionService: RekognitionService | null = null

export function getRekognitionService(): RekognitionService {
  if (!rekognitionService) {
    rekognitionService = new RekognitionService()
  }
  return rekognitionService
}