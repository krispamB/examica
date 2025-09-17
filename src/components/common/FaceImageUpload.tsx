'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
// import { validateFaceImage } from '@/lib/storage/face-images'

interface FaceImageUploadProps {
  onImageSelect: (file: File | null) => void
  selectedImage: File | null
  disabled?: boolean
  className?: string
}

const FaceImageUpload: React.FC<FaceImageUploadProps> = ({
  onImageSelect,
  selectedImage,
  disabled = false,
  className,
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Basic client-side validation
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setError('Image file must be smaller than 5MB')
      return
    }

    setError(null)
    onImageSelect(file)

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const files = e.dataTransfer.files
    handleFiles(files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    setError(null)
    onImageSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">
          Face Image (Optional)
        </label>
        <p className="text-sm text-secondary">
          Upload a clear photo of the student&apos;s face for facial recognition
          verification.
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive
            ? 'border-primary bg-primary-light'
            : 'border-border hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer hover:bg-background-secondary/50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
        />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <Image
                src={previewUrl}
                alt="Face preview"
                width={128}
                height={128}
                className="h-32 w-32 object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
                disabled={disabled}
                className="absolute -top-2 -right-2 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-secondary">
              {selectedImage?.name} (
              {Math.round((selectedImage?.size || 0) / 1024)}KB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-secondary"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="space-y-2">
              <p className="text-sm text-foreground font-medium">
                Drop an image here or click to browse
              </p>
              <p className="text-xs text-secondary">
                JPEG, PNG, WebP up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-error-light border border-error/20 text-error px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {selectedImage && !previewUrl && (
        <div className="flex items-center justify-between bg-background-secondary px-3 py-2 rounded-md">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-primary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
            </svg>
            <span className="text-sm text-foreground">
              {selectedImage.name}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            Remove
          </Button>
        </div>
      )}

      <div className="bg-info-light border border-info/20 text-info px-3 py-2 rounded-md text-xs">
        <p className="font-medium">Face Image Guidelines:</p>
        <ul className="mt-1 list-disc list-inside space-y-1">
          <li>Clear, front-facing photo with good lighting</li>
          <li>Face should be clearly visible and centered</li>
          <li>No sunglasses, hats, or obstructions</li>
          <li>High quality image (preferably 300x300 or larger)</li>
        </ul>
      </div>
    </div>
  )
}

export default FaceImageUpload
