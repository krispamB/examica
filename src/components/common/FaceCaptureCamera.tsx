'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Camera, RotateCcw, CheckCircle, X } from 'lucide-react'

interface FaceCameraCaptureProps {
  onCapture: (imageBase64: string) => void
  onCancel?: () => void
  isLoading?: boolean
  className?: string
}

export const FaceCameraCapture: React.FC<FaceCameraCaptureProps> = ({
  onCapture,
  onCancel,
  isLoading = false,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)
      }
    } catch (err) {
      console.error('Camera access error:', err)
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError(
            'Camera access denied. Please allow camera access and try again.'
          )
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera and try again.')
        } else {
          setError('Failed to access camera. Please try again.')
        }
      } else {
        setError('Failed to access camera. Please try again.')
      }
    }
  }, [])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }, [])

  // Capture the actual image
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to base64
    const previewUrl = canvas.toDataURL('image/jpeg', 0.8)

    setCapturedImage(previewUrl)
    stopCamera()
  }, [stopCamera])

  // Capture image with countdown
  const captureWithCountdown = useCallback(() => {
    if (!isCameraActive || countdown !== null) return

    let count = 3
    setCountdown(count)

    const countdownInterval = setInterval(() => {
      count--
      setCountdown(count)

      if (count === 0) {
        clearInterval(countdownInterval)
        setTimeout(() => {
          captureImage()
          setCountdown(null)
        }, 200)
      }
    }, 1000)
  }, [isCameraActive, countdown, captureImage])

  // Retry capture (restart camera)
  const retryCapture = useCallback(() => {
    setCapturedImage(null)
    setError(null)
    startCamera()
  }, [startCamera])

  // Confirm and submit captured image
  const confirmCapture = useCallback(() => {
    if (!capturedImage) return

    // Extract base64 data
    const base64Data = capturedImage.split(',')[1]
    onCapture(base64Data)
  }, [capturedImage, onCapture])

  // Handle cancel
  const handleCancel = useCallback(() => {
    stopCamera()
    setCapturedImage(null)
    setError(null)
    if (onCancel) onCancel()
  }, [stopCamera, onCancel])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Auto-start camera on mount
  useEffect(() => {
    startCamera()
  }, [startCamera])

  if (error) {
    return (
      <div
        className={`bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto ${className}`}
      >
        <div className="text-center">
          <div className="bg-red-50 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Camera Error
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            {onCancel && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (capturedImage) {
    return (
      <div
        className={`bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto ${className}`}
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Review Your Photo
          </h3>
          <div className="mb-4 relative">
            <Image
              src={capturedImage}
              alt="Captured face"
              width={400}
              height={256}
              className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
            />
          </div>
          <p className="text-gray-600 mb-6">
            Please review your photo. Make sure your face is clearly visible and
            well-lit.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={retryCapture}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={confirmCapture}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {isLoading ? 'Verifying...' : 'Use This Photo'}
            </button>
          </div>
          {onCancel && (
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="mt-3 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel Verification
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto ${className}`}
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Face Verification
        </h3>

        <div className="mb-4 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover rounded-lg border-2 border-gray-200 bg-gray-100"
          />
          <canvas ref={canvasRef} className="hidden" />

          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {countdown}
                </span>
              </div>
            </div>
          )}
        </div>

        <p className="text-gray-600 mb-6">
          Position your face in the camera frame and click capture when ready.
          Make sure you&apos;re in good lighting and looking directly at the
          camera.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={captureWithCountdown}
            disabled={!isCameraActive || countdown !== null || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {countdown !== null ? 'Capturing...' : 'Capture Photo'}
          </button>
          {onCancel && (
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span>{isCameraActive ? 'Camera Active' : 'Camera Inactive'}</span>
          </div>
          <p>
            Your image will be compared with your registered photo for
            verification.
          </p>
        </div>
      </div>
    </div>
  )
}

export default FaceCameraCapture
