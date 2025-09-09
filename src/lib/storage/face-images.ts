import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'

export interface FaceImageUpload {
  file: File
  userId: string
}

export interface FaceImageResult {
  success: boolean
  url?: string
  error?: string
}

export const FACE_IMAGES_BUCKET = 'face-images'
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

export function validateFaceImage(file: File): {
  valid: boolean
  error?: string
} {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }
  }

  return { valid: true }
}

export function generateFaceImagePath(
  userId: string,
  originalName: string
): string {
  const timestamp = Date.now()
  const extension = originalName.split('.').pop()?.toLowerCase()
  return `${userId}/face-${timestamp}.${extension}`
}

export async function uploadFaceImage(
  file: File,
  userId: string,
  useServerClient = true
): Promise<FaceImageResult> {
  try {
    // Validate the image
    const validation = validateFaceImage(file)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Validation failed',
      }
    }

    // Get the appropriate Supabase client
    const supabase = useServerClient
      ? await createClient()
      : createClientClient()

    // Generate unique file path
    const filePath = generateFaceImagePath(userId, file.name)

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(FACE_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting existing face images
      })

    if (error) {
      console.error('Supabase storage upload error:', error)
      console.error('Upload error details:', {
        message: error.message,
        bucket: FACE_IMAGES_BUCKET,
        filePath,
        userId,
        fileSize: file.size,
        fileType: file.type,
      })

      // Provide more specific error messages
      if (error.message?.includes('Duplicate')) {
        return {
          success: false,
          error: 'A face image already exists. Please try again to update it.',
        }
      } else if (
        error.message?.includes('Policy') ||
        error.message?.includes('permission')
      ) {
        return {
          success: false,
          error:
            'Insufficient permissions to upload image. Please contact your administrator.',
        }
      } else if (error.message?.includes('size')) {
        return {
          success: false,
          error: 'Image file is too large. Maximum size is 5MB.',
        }
      } else if (
        error.message?.includes('not found') ||
        error.message?.includes('bucket')
      ) {
        return {
          success: false,
          error: `Storage bucket '${FACE_IMAGES_BUCKET}' not found. Please contact your administrator.`,
        }
      }

      return {
        success: false,
        error: `Upload failed: ${error.message || 'Unknown storage error'}`,
      }
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(FACE_IMAGES_BUCKET)
      .getPublicUrl(filePath)

    if (!urlData.publicUrl) {
      return {
        success: false,
        error: 'Failed to generate public URL for uploaded image',
      }
    }

    return {
      success: true,
      url: urlData.publicUrl,
    }
  } catch (error) {
    console.error('Face image upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function deleteFaceImage(
  imageUrl: string,
  useServerClient = true
): Promise<boolean> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const filePath = pathParts.slice(-2).join('/') // Get userId/filename part

    const supabase = useServerClient
      ? await createClient()
      : createClientClient()

    const { error } = await supabase.storage
      .from(FACE_IMAGES_BUCKET)
      .remove([filePath])

    if (error) {
      console.error('Failed to delete face image:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Face image deletion error:', error)
    return false
  }
}

export async function getFaceImageUrl(
  userId: string,
  useServerClient = true
): Promise<string | null> {
  try {
    const supabase = useServerClient
      ? await createClient()
      : createClientClient()

    // List files for the user
    const { data, error } = await supabase.storage
      .from(FACE_IMAGES_BUCKET)
      .list(userId, {
        limit: 1,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error || !data || data.length === 0) {
      return null
    }

    const latestFile = data[0]
    const { data: urlData } = supabase.storage
      .from(FACE_IMAGES_BUCKET)
      .getPublicUrl(`${userId}/${latestFile.name}`)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error getting face image URL:', error)
    return null
  }
}

export async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = result.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = () => reject(new Error('Failed to convert file to base64'))
    reader.readAsDataURL(file)
  })
}

export async function urlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64Data = result.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = () =>
        reject(new Error('Failed to convert URL to base64'))
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    throw new Error(`Failed to fetch and convert image: ${error}`)
  }
}

/**
 * Move a face image from temporary location to final user location
 * Used when a student accepts their invitation
 */
export async function moveFaceImageFromTemp(
  tempImageUrl: string,
  finalUserId: string,
  useServerClient = true
): Promise<FaceImageResult> {
  try {
    console.log('Starting face image migration:', {
      tempImageUrl,
      finalUserId,
      useServerClient,
    })

    const supabase = useServerClient
      ? await createClient()
      : createClientClient()

    // Extract the temp file path from URL
    const url = new URL(tempImageUrl)
    const pathParts = url.pathname.split('/')
    const fileName = pathParts[pathParts.length - 1]
    const tempPath = pathParts.slice(-2).join('/') // Get temp-id/filename

    console.log('Extracted path info:', {
      fullUrl: tempImageUrl,
      pathParts,
      fileName,
      tempPath,
    })

    // Download the temp file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(FACE_IMAGES_BUCKET)
      .download(tempPath)

    if (downloadError || !fileData) {
      console.error('Failed to download temp image:', downloadError)
      return {
        success: false,
        error: 'Failed to access temporary image file',
      }
    }

    console.log('Successfully downloaded temp file, size:', fileData.size)

    // Create new file path for final location
    const timestamp = Date.now()
    const extension = fileName.split('.').pop()?.toLowerCase()
    const finalPath = `${finalUserId}/face-${timestamp}.${extension}`

    console.log('Attempting upload to final path:', finalPath)

    // Try to check what auth context we're in
    try {
      const { data: authUser, error: authError } = await supabase.auth.getUser()
      console.log('Auth context during migration:', {
        user: authUser?.user?.id || 'none',
        error: authError?.message || 'none',
      })
    } catch (e) {
      console.log('Auth check failed (might be service role):', e)
    }

    // Upload to final location
    const { error: uploadError } = await supabase.storage
      .from(FACE_IMAGES_BUCKET)
      .upload(finalPath, fileData, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Failed to upload to final location:', uploadError)
      console.error('Upload context:', {
        finalPath,
        fileSize: fileData.size,
        bucket: FACE_IMAGES_BUCKET,
      })
      return {
        success: false,
        error: 'Failed to move image to final location',
      }
    }

    // Get the new public URL
    const { data: urlData } = supabase.storage
      .from(FACE_IMAGES_BUCKET)
      .getPublicUrl(finalPath)

    // Clean up temp file (optional - let it expire naturally)
    try {
      await supabase.storage.from(FACE_IMAGES_BUCKET).remove([tempPath])
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError)
      // Don't fail the operation for cleanup issues
    }

    return {
      success: true,
      url: urlData.publicUrl,
    }
  } catch (error) {
    console.error('Face image move error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move image',
    }
  }
}

/**
 * Clean up expired temporary face images
 */
export async function cleanupExpiredTempImages(
  maxAgeHours = 168, // 7 days
  useServerClient = true
): Promise<{ success: boolean; cleaned: number; error?: string }> {
  try {
    const supabase = useServerClient
      ? await createClient()
      : createClientClient()
    const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)

    // List all objects in the bucket
    const { data: objects, error: listError } = await supabase.storage
      .from(FACE_IMAGES_BUCKET)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' },
      })

    if (listError || !objects) {
      return {
        success: false,
        cleaned: 0,
        error: 'Failed to list storage objects',
      }
    }

    // Find temp files older than cutoff
    const tempFilesToDelete = objects
      .filter((obj) => {
        // Check if it's a temp file (starts with 'temp-')
        const isTemp = obj.name.startsWith('temp-')
        // Check if it's older than cutoff
        const isOld = obj.created_at
          ? new Date(obj.created_at) < cutoffDate
          : false
        return isTemp && isOld
      })
      .map((obj) => obj.name)

    if (tempFilesToDelete.length === 0) {
      return {
        success: true,
        cleaned: 0,
      }
    }

    // Delete the expired temp files
    const { error: deleteError } = await supabase.storage
      .from(FACE_IMAGES_BUCKET)
      .remove(tempFilesToDelete)

    if (deleteError) {
      console.error('Failed to delete temp files:', deleteError)
      return {
        success: false,
        cleaned: 0,
        error: 'Failed to delete expired files',
      }
    }

    return {
      success: true,
      cleaned: tempFilesToDelete.length,
    }
  } catch (error) {
    console.error('Cleanup error:', error)
    return {
      success: false,
      cleaned: 0,
      error: error instanceof Error ? error.message : 'Unknown cleanup error',
    }
  }
}
