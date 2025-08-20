'use client'

import { useState, useRef } from 'react'
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

interface LogoUploadProps {
  currentLogoUrl?: string
  salonId: string
  onLogoUpdate: (logoUrl: string | null) => void
  className?: string
}

export default function LogoUpload({ 
  currentLogoUrl, 
  salonId, 
  onLogoUpdate, 
  className = '' 
}: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return `❌ Only image files (JPG, PNG, SVG) are allowed. The file '${file.name}' is not supported.`
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return `❌ File '${file.name}' is too large. Maximum size is 5MB. Please choose a smaller image.`
    }

    return null
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Clear previous errors
    setError('')

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    uploadLogo(file)
  }

  const uploadLogo = async (file: File) => {
    try {
      setUploading(true)
      setUploadProgress(0)
      setError('')

      // Create storage reference
      const fileName = `logo-${Date.now()}-${file.name}`
      const storageRef = ref(storage, `salon-logos/${salonId}/${fileName}`)

      // Upload file
      const snapshot = await uploadBytes(storageRef, file)
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      // Update parent component
      onLogoUpdate(downloadURL)
      
      // Update local state
      setPreviewUrl(downloadURL)
      setUploadProgress(100)
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Logo upload error:', error)
      setError('❌ Upload failed. Please check your internet connection and try again.')
      setPreviewUrl(currentLogoUrl || null) // Revert to previous logo
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const removeLogo = async () => {
    try {
      setError('')
      
      if (currentLogoUrl) {
        // Delete from Firebase Storage
        const logoRef = ref(storage, currentLogoUrl)
        await deleteObject(logoRef)
      }
      
      // Update parent component
      onLogoUpdate(null)
      
      // Update local state
      setPreviewUrl(null)
      
    } catch (error) {
      console.error('Logo removal error:', error)
      setError('❌ Unable to remove logo. Please try again or contact support.')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      // Clear previous errors
      setError('')
      
      // Validate file
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      // Create preview and upload
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      uploadLogo(file)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Salon Logo
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Upload your salon logo (JPG, PNG, or SVG, max 5MB)
        </p>
      </div>

      {/* Current Logo Display */}
      {previewUrl && (
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img 
              src={previewUrl} 
              alt="Salon logo" 
              className="h-20 w-20 object-contain border border-gray-200 rounded-lg"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="text-white text-xs">Uploading...</div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={removeLogo}
            className="text-red-600 hover:text-red-800 text-sm flex items-center"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Remove Logo
          </button>
        </div>
      )}

      {/* Upload Area */}
      {!previewUrl && (
        <div
          className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors ${
            uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, or SVG up to 5MB
            </p>
          </div>
        </div>
      )}

      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Upload Progress */}
      {uploading && uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}
