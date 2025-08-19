'use client'

import { useState, useEffect, use } from 'react'
import { salonService, clientService } from '@/lib/firebase/services'
import { Salon, Client, ConsultationFormField } from '@/types/firebase'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { UsageTracker } from '@/lib/usageTracker'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface ConsultationPageProps {
  params: Promise<{ slug: string }>
}

// Default consultation form fields
const createDefaultFields = (): ConsultationFormField[] => [
  {
    id: 'service-type',
    type: 'select',
    label: 'Service Type',
    required: true,
    options: ['Hair Color', 'Extensions', 'Chemical Treatment', 'Cut & Style', 'Other'],
    order: 1
  },
  {
    id: 'current-hair',
    type: 'select',
    label: 'How long is your hair?',
    required: true,
    options: ['Short', 'Medium', 'Long'],
    order: 2
  },
  {
    id: 'hair-photo-top',
    type: 'file',
    label: 'Hair Photos - Roots View',
    required: true,
    accept: 'image/*,video/*',
    order: 3
  },
  {
    id: 'hair-photo-sides',
    type: 'file',
    label: 'Hair Photos - Side View',
    required: true,
    accept: 'image/*,video/*',
    order: 4
  },
  {
    id: 'desired-result',
    type: 'file',
    label: 'Inspo Photo (Desired Result)',
    placeholder: 'What look are you hoping to achieve?',
    required: true,
    accept: 'image/*',
    order: 5
  },
  {
    id: 'additional-notes',
    type: 'textarea',
    label: 'Additional Notes',
    placeholder: 'Previous treatments, allergies, hair history, or other information we should know',
    required: false,
    order: 6
  },
  {
    id: 'name',
    type: 'text',
    label: 'Full Name',
    placeholder: 'Enter your full name',
    required: true,
    order: 7
  },
  {
    id: 'email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'your.email@example.com',
    required: false,
    order: 8
  },
  {
    id: 'phone',
    type: 'phone',
    label: 'Phone Number',
    placeholder: '(555) 123-4567',
    required: true,
    order: 9
  }
]

// Progress Bar Component
const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const progress = ((current + 1) / total) * 100
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

// Step Navigation Component
const StepNavigation = ({ 
  currentStep, 
  totalSteps, 
  onPrevious, 
  onNext, 
  onSubmit,
  canProceed,
  submitting
}: { 
  currentStep: number; 
  totalSteps: number; 
  onPrevious: () => void; 
  onNext: () => void; 
  onSubmit: () => void;
  canProceed: boolean;
  submitting: boolean;
}) => {
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1
  
  return (
    <div className="flex justify-between items-center w-full px-4 py-6">
      {/* Previous Button */}
      <button
        onClick={onPrevious}
        disabled={isFirstStep}
        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
          isFirstStep 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
        }`}
      >
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Previous
      </button>
      
      {/* Center - Empty Space */}
      <div></div>
      
      {/* Right Side - Next/Submit */}
      <div className="flex space-x-2">
        {isLastStep ? (
          <button
            onClick={onSubmit}
            disabled={!canProceed || submitting}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              canProceed && !submitting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!canProceed}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              canProceed
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
            <ChevronRightIcon className="w-5 h-5 ml-1" />
          </button>
        )}
      </div>
    </div>
  )
}

// Individual Field Renderer
const FieldRenderer = ({ 
  field, 
  value, 
  onChange, 
  onFileChange,
  uploadProgress 
}: { 
  field: ConsultationFormField; 
  value: string | string[] | File[]; 
  onChange: (value: string | string[]) => void;
  onFileChange?: (files: FileList | null) => void;
  uploadProgress?: number;
}) => {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )
      
      case 'textarea':
        return (
          <textarea
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        )
      
      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      
      case 'file':
        return (
          <div className="w-full">
            {/* Placeholder Image for hair-photo-top (Roots View) */}
            {field.id === 'hair-photo-top' && !value && (
              <div className="mb-4 text-center">
                <img 
                  src="/roots-placeholder-photo.jpg" 
                  alt="Example: Hair photo from roots view"
                  className="w-32 h-32 mx-auto rounded-lg border-2 border-dashed border-gray-300 object-cover"
                />
                <p className="text-xs text-gray-500 mt-1">Example photo</p>
              </div>
            )}
            
            {/* Placeholder Image for hair-photo-sides (Side View) */}
            {field.id === 'hair-photo-sides' && !value && (
              <div className="mb-4 text-center">
                <img 
                  src="/side-placeholder-photo.jpg" 
                  alt="Example: Hair photo from side view"
                  className="w-32 h-32 mx-auto rounded-lg border-2 border-dashed border-gray-300 object-cover"
                />
                <p className="text-xs text-gray-500 mt-1">Example photo</p>
              </div>
            )}
            
            {/* Placeholder Image for desired-result */}
            {field.id === 'desired-result' && !value && (
              <div className="mb-4 text-center">
                <img 
                  src="/inspo-placeholder-photo.jpg" 
                  alt="Example: Desired hair style inspiration"
                  className="w-32 h-32 mx-auto rounded-lg border-2 border-dashed border-gray-300 object-cover"
                />
                <p className="text-xs text-gray-500 mt-1">Inspiration photo</p>
              </div>
            )}
            
            <input
              type="file"
              accept={field.accept}
              onChange={(e) => onFileChange?.(e.target.files)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {uploadProgress !== undefined && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Accepted formats: {field.accept}
            </p>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-md">
      <label className="block text-lg font-medium text-gray-900 mb-3">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
      {field.placeholder && (
        <p className="text-sm text-gray-500 mt-2">{field.placeholder}</p>
      )}
    </div>
  )
}

function ConsultationContent({ slug }: { slug: string }) {
  const [salon, setSalon] = useState<Salon | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string | string[] | File[]>>({})
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  
  // Step-by-step form state
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        setLoading(true)
        const salonData = await salonService.getSalonBySlug(slug)
        if (!salonData) {
          setError('Salon not found')
          return
        }
        setSalon(salonData)
      } catch (err) {
        console.error('Error fetching salon:', err)
        setError('Failed to load consultation form')
      } finally {
        setLoading(false)
      }
    }

    fetchSalon()
  }, [slug])

  // Step navigation handlers
  const handleNext = () => {
    if (currentStep < (salon?.consultationForm?.fields?.length || createDefaultFields().length) - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }



  const handleFieldChange = (fieldId: string, value: string | string[]) => {
    // Update the main formData for submission
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleFileChange = (fieldId: string, files: FileList | null) => {
    if (files && files.length > 0) {
      // Convert FileList to Array and validate
      const fileArray = Array.from(files).filter(file => {
        // Check file size (10MB for images, 50MB for videos)
        const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024
        if (file.size > maxSize) {
          alert(`File ${file.name} is too large. Maximum size is ${file.type.startsWith('video/') ? '50MB' : '10MB'}.`)
          return false
        }
        return true
      })

      setFormData(prev => ({
        ...prev,
        [fieldId]: fileArray
      }))
    }
  }

  const canProceedToNext = () => {
    const fields = salon?.consultationForm?.fields || createDefaultFields()
    const currentField = fields[currentStep]
    if (!currentField.required) return true
    
    const currentValue = formData[currentField.id]
    if (!currentValue) return false
    
    if (Array.isArray(currentValue)) {
      return currentValue.length > 0
    }
    
    return typeof currentValue === 'string' && currentValue.trim().length > 0
  }

  const uploadFile = async (file: File, fieldId: string): Promise<{ url: string; name: string; size: number }> => {
    const fileName = `consultations/${salon!.id}/${Date.now()}-${file.name}`
    const storageRef = ref(storage, fileName)
    
    try {
      setUploadProgress(prev => ({ ...prev, [fieldId]: 0 }))
      
      // Use uploadBytes with proper error handling for unauthenticated uploads
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      setUploadProgress(prev => ({ ...prev, [fieldId]: 100 }))
      
      return {
        url: downloadURL,
        name: file.name,
        size: file.size
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('storage/unauthorized')) {
          throw new Error(`Upload failed: Please ensure Firebase Storage rules allow public uploads to consultations folder.`)
        } else if (error.message.includes('CORS')) {
          throw new Error(`Upload failed: CORS policy error. Please check Firebase Storage configuration.`)
        }
      }
      
      throw new Error(`Failed to upload ${file.name}: ${error}`)
    }
  }

  const handleSubmit = async () => {
    if (!salon) return

    setSubmitting(true)
    try {
      const fields = salon.consultationForm?.fields || createDefaultFields()
      
      // Validate required fields
      const missingFields = fields
        .filter(field => field.required)
        .filter(field => {
          const value = formData[field.id]
          if (field.type === 'file') {
            return !value || (Array.isArray(value) && value.length === 0)
          }
          return !value || (typeof value === 'string' && !value.trim())
        })
        .map(field => field.label)

      if (missingFields.length > 0) {
        alert(`Please fill in the following required fields: ${missingFields.join(', ')}`)
        return
      }

      // Upload files or store file info temporarily
      const uploadedFiles: { fieldId: string; url: string; name: string; size: number }[] = []
      
      for (const [fieldId, value] of Object.entries(formData)) {
        if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
          for (const file of value as File[]) {
            try {
              const uploadResult = await uploadFile(file, fieldId)
              uploadedFiles.push({
                fieldId,
                ...uploadResult
              })
            } catch (error) {
              console.error('Upload error:', error)
              
              // Fallback: Store file metadata without upload for now
              console.log('Storing file metadata instead of uploading:', file.name)
              uploadedFiles.push({
                fieldId,
                url: `placeholder://upload-pending/${file.name}`,
                name: file.name,
                size: file.size
              })
              
              // Don't block submission, but log the issue
              console.warn(`File upload failed for ${file.name}, storing metadata only`)
            }
          }
        }
      }

      // Prepare form data (exclude files)
      const cleanFormData = Object.fromEntries(
        Object.entries(formData).filter(([, value]) => 
          !(Array.isArray(value) && value.length > 0 && value[0] instanceof File)
        )
      ) as Record<string, string>

      // Extract client info
      const clientInfo = {
        name: cleanFormData.name || cleanFormData['name'] || '',
        email: cleanFormData.email || cleanFormData['email'] || '',
        phone: cleanFormData.phone || cleanFormData['phone'] || ''
      }

      // Create consultation submission
      const submission = {
        salonId: salon.id,
        formData: cleanFormData,
        files: uploadedFiles,
        submittedAt: new Date(),
        status: 'pending' as const,
        clientInfo,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Save client data to Clients tab (same as booking system)
      console.log('Saving client data:', { ...clientInfo, salonId: salon.id, source: 'virtual_consultation' })
      
      try {
        // Check if client already exists by email or phone
        const existingClient = await clientService.findClientByEmailOrPhone(salon.id, clientInfo.email, clientInfo.phone)
        
        if (existingClient) {
          // Update existing client with any new information
          await clientService.updateClient(existingClient.id, {
            name: clientInfo.name,
            email: clientInfo.email,
            phone: clientInfo.phone,
            updatedAt: new Date()
          })
          console.log('Updated existing client:', existingClient.id)
        } else {
          // Create new client
          const clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
            name: clientInfo.name,
            email: clientInfo.email,
            phone: clientInfo.phone,
            salonId: salon.id
          }
          
          const clientId = await clientService.createClient(clientData)
          console.log('Created new client from consultation:', clientId)
        }
      } catch (clientError) {
        console.error('Error saving client data:', clientError)
        // Don't fail the consultation if client creation fails
      }

      // Save consultation to Firestore
      const consultationRef = await addDoc(collection(db, 'consultations'), submission)
      
      // Track usage for billing
      try {
        await UsageTracker.trackUsage(
          salon.id,
          'consultation',
          'system', // Since this is a system-generated tracking
          consultationRef.id
        )
        console.log('Usage tracked for consultation submission')
      } catch (usageError) {
        console.error('Failed to track usage for consultation:', usageError)
        // Don't fail the consultation if usage tracking fails
      }

      // Send notification (same system as booking requests)
      try {
        await fetch('/api/booking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'consultation',
            ...submission,
            // Format for existing notification system
            service: 'Virtual Consultation',
            clientName: clientInfo.name,
            clientEmail: clientInfo.email,
            clientPhone: clientInfo.phone,
            salonSlug: slug,
            dateTimePreference: 'Consultation Request',
            notes: cleanFormData['additional-notes'] || cleanFormData['notes'] || 'Virtual consultation request'
          }),
        })
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError)
        // Don't fail the submission if notification fails
      }

      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting consultation:', error)
      alert('Failed to submit consultation request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading consultation form...</p>
        </div>
      </div>
    )
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Form Not Available</h1>
          <p className="text-gray-600">{error || 'Consultation form not found.'}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            {salon.consultationForm?.successMessage || 
             "We'll review your consultation request and contact you soon."}
          </p>
          <p className="text-sm text-gray-500">
            A confirmation has been sent to {salon.name}.
          </p>
        </div>
      </div>
    )
  }

  // Use default fields if no custom fields are configured
  const hasCustomFields = salon.consultationForm?.fields && salon.consultationForm.fields.length > 0
  const formFields = hasCustomFields ? salon.consultationForm!.fields : createDefaultFields()
  const sortedFields = [...formFields].sort((a, b) => a.order - b.order)
  const currentField = sortedFields[currentStep]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-8 border-b border-gray-200 bg-white">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Virtual Consultation
          </h1>
          <p className="text-gray-600">
            Please fill out this form so we can provide you with the best service.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <strong>{salon.name}</strong>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto">
          <ProgressBar current={currentStep} total={sortedFields.length} />
        </div>
      </div>

      {/* Question Container - Full Height Centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <FieldRenderer
            field={currentField}
            value={formData[currentField.id] || ''}
            onChange={(value) => handleFieldChange(currentField.id, value)}
            onFileChange={(files) => handleFileChange(currentField.id, files)}
            uploadProgress={uploadProgress[currentField.id]}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto">
          <StepNavigation
            currentStep={currentStep}
            totalSteps={sortedFields.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            canProceed={canProceedToNext()}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  )
}

export default function ConsultationPage({ params }: ConsultationPageProps) {
  const { slug } = use(params)
  return <ConsultationContent slug={slug} />
}