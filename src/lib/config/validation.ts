export interface ConfigValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface EnvironmentConfig {
  // Next.js
  APP_NAME: string
  APP_URL: string
  
  // Supabase
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  
  // AWS Rekognition
  AWS_REGION: string
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  
  // Storage
  FACE_IMAGES_BUCKET: string
  
  // Facial Recognition Thresholds
  SIMILARITY_THRESHOLD: number
  CONFIDENCE_THRESHOLD: number
  
  // Email
  RESEND_API_KEY: string
}

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'RESEND_API_KEY',
] as const

// Optional environment variables for future use
// const OPTIONAL_ENV_VARS = [
//   'NEXT_PUBLIC_APP_NAME',
//   'SUPABASE_STORAGE_FACE_IMAGES_BUCKET',
//   'FACIAL_SIMILARITY_THRESHOLD',
//   'FACIAL_CONFIDENCE_THRESHOLD',
// ] as const

export function validateEnvironment(): ConfigValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required environment variables
  REQUIRED_ENV_VARS.forEach(envVar => {
    const value = process.env[envVar]
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${envVar}`)
    }
  })

  // Validate specific environment variables
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL')
  }

  if (process.env.NEXT_PUBLIC_APP_URL && 
      !process.env.NEXT_PUBLIC_APP_URL.startsWith('http')) {
    errors.push('NEXT_PUBLIC_APP_URL must be a valid HTTP/HTTPS URL')
  }

  // Check AWS region format
  if (process.env.AWS_REGION && 
      !/^[a-z]{2}-[a-z]+-\d{1}$/.test(process.env.AWS_REGION)) {
    warnings.push('AWS_REGION format may be invalid (expected: us-east-1, eu-west-1, etc.)')
  }

  // Validate thresholds
  const similarityThreshold = process.env.FACIAL_SIMILARITY_THRESHOLD
  if (similarityThreshold) {
    const threshold = parseInt(similarityThreshold, 10)
    if (isNaN(threshold) || threshold < 50 || threshold > 99) {
      warnings.push('FACIAL_SIMILARITY_THRESHOLD should be between 50 and 99')
    }
  }

  const confidenceThreshold = process.env.FACIAL_CONFIDENCE_THRESHOLD
  if (confidenceThreshold) {
    const threshold = parseInt(confidenceThreshold, 10)
    if (isNaN(threshold) || threshold < 70 || threshold > 99) {
      warnings.push('FACIAL_CONFIDENCE_THRESHOLD should be between 70 and 99')
    }
  }

  // Check for placeholder values
  const checkForPlaceholders = [
    'your_supabase_project_url',
    'your_supabase_anon_key',
    'your_aws_access_key',
    'your_resend_api_key',
  ]

  Object.entries(process.env).forEach(([key, value]) => {
    if (value && checkForPlaceholders.some(placeholder => value.includes(placeholder))) {
      errors.push(`Environment variable ${key} contains placeholder value`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    // Next.js
    APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Examica',
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    
    // Supabase
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    
    // AWS Rekognition
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
    
    // Storage
    FACE_IMAGES_BUCKET: process.env.SUPABASE_STORAGE_FACE_IMAGES_BUCKET || 'face-images',
    
    // Facial Recognition Thresholds
    SIMILARITY_THRESHOLD: parseInt(process.env.FACIAL_SIMILARITY_THRESHOLD || '80', 10),
    CONFIDENCE_THRESHOLD: parseInt(process.env.FACIAL_CONFIDENCE_THRESHOLD || '90', 10),
    
    // Email
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  }
}

// Utility function to safely check if environment is ready for facial recognition
export function isFacialRecognitionEnabled(): boolean {
  const config = getEnvironmentConfig()
  return !!(
    config.AWS_ACCESS_KEY_ID &&
    config.AWS_SECRET_ACCESS_KEY &&
    config.AWS_REGION &&
    !config.AWS_ACCESS_KEY_ID.includes('your_') &&
    !config.AWS_SECRET_ACCESS_KEY.includes('your_')
  )
}

// Log validation results on startup (only in development)
if (process.env.NODE_ENV === 'development') {
  const validation = validateEnvironment()
  
  if (!validation.valid) {
    console.error('❌ Environment configuration errors:')
    validation.errors.forEach(error => console.error(`  - ${error}`))
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Environment configuration warnings:')
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }
  
  if (validation.valid && validation.warnings.length === 0) {
    console.log('✅ Environment configuration is valid')
  }
  
  // Check facial recognition status
  if (isFacialRecognitionEnabled()) {
    console.log('🔍 Facial recognition is enabled')
  } else {
    console.warn('⚠️ Facial recognition is disabled (missing AWS credentials)')
  }
}