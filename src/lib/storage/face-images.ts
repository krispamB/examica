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
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export function validateFaceImage(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    }
  }

  return { valid: true }
}

export function generateFaceImagePath(userId: string, originalName: string): string {
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
        error: validation.error
      }
    }

    // Get the appropriate Supabase client
    const supabase = useServerClient ? await createClient() : createClientClient()

    // Generate unique file path
    const filePath = generateFaceImagePath(userId, file.name)

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(FACE_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Allow overwriting existing face images
      })

    if (error) {
      console.error('Supabase storage error:', error)
      return {
        success: false,
        error: 'Failed to upload image to storage'
      }
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(FACE_IMAGES_BUCKET)
      .getPublicUrl(filePath)

    return {
      success: true,
      url: urlData.publicUrl
    }

  } catch (error) {
    console.error('Face image upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function deleteFaceImage(imageUrl: string, useServerClient = true): Promise<boolean> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const filePath = pathParts.slice(-2).join('/') // Get userId/filename part

    const supabase = useServerClient ? await createClient() : createClientClient()

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

export async function getFaceImageUrl(userId: string, useServerClient = true): Promise<string | null> {
  try {
    const supabase = useServerClient ? await createClient() : createClientClient()

    // List files for the user
    const { data, error } = await supabase.storage
      .from(FACE_IMAGES_BUCKET)
      .list(userId, {
        limit: 1,
        sortBy: { column: 'created_at', order: 'desc' }
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
      reader.onerror = () => reject(new Error('Failed to convert URL to base64'))
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    throw new Error(`Failed to fetch and convert image: ${error}`)
  }
}