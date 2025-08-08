'use client'

import { useState, useEffect, use } from 'react'
import { salonService } from '@/lib/firebase/services'
import { Salon } from '@/types/firebase'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface ConsultationPageProps {
  params: Promise<{ slug: string }>
}

function ConsultationContent({ slug }: { slug: string }) {
  const [salon, setSalon] = useState<Salon | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string | File[]>>({})
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

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

  const handleInputChange = (fieldId: string, value: string) => {
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

  const uploadFile = async (file: File, fieldId: string): Promise<{ url: string; name: string; size: number }> => {
    const fileName = `consultations/${salon!.id}/${Date.now()}-${file.name}`
    const storageRef = ref(storage, fileName)
    
    try {
      setUploadProgress(prev => ({ ...prev, [fieldId]: 0 }))
      
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
      throw new Error(`Failed to upload ${file.name}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!salon) return

    setSubmitting(true)
    try {
      const fields = salon.consultationForm?.fields || []
      
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

      // Upload files
      const uploadedFiles: { fieldId: string; url: string; name: string; size: number }[] = []
      
      for (const [fieldId, value] of Object.entries(formData)) {
        if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
          for (const file of value) {
            try {
              const uploadResult = await uploadFile(file, fieldId)
              uploadedFiles.push({
                fieldId,
                ...uploadResult
              })
            } catch (error) {
              console.error('Upload error:', error)
              alert(`Failed to upload file: ${file.name}`)
              return
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

      // Save to Firestore
      await addDoc(collection(db, 'consultations'), submission)

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
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading consultation form...</p>
        </div>
      </div>
    )
  }

  if (error || !salon) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Form Not Available</h1>
          <p className="text-gray-600">{error || 'Consultation form not found.'}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
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

  const formFields = salon.consultationForm?.fields || []
  const sortedFields = [...formFields].sort((a, b) => a.order - b.order)

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-6 py-8 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Virtual Consultation
          </h1>
          <p className="text-gray-600">
            Please fill out this form so we can better understand your needs and provide you with the best service.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <strong>{salon.name}</strong>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {sortedFields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {field.type === 'textarea' ? (
                <textarea
                  value={(formData[field.id] as string) || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              ) : field.type === 'select' ? (
                <select
                  value={(formData[field.id] as string) || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  required={field.required}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select an option...</option>
                  {field.options?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === 'file' ? (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept={field.accept || 'image/*,video/*'}
                    multiple
                    onChange={(e) => handleFileChange(field.id, e.target.files)}
                    required={field.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  {uploadProgress[field.id] !== undefined && uploadProgress[field.id] < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress[field.id]}%` }}
                      ></div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Accepted formats: Images and videos. Max size: {field.accept?.includes('video') ? '50MB' : '10MB'}
                  </p>
                </div>
              ) : (
                <input
                  type={field.type}
                  value={(formData[field.id] as string) || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              )}
            </div>
          ))}

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : (salon.consultationForm?.submitButtonText || 'Submit Consultation Request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ConsultationPage({ params }: ConsultationPageProps) {
  const { slug } = use(params)
  return <ConsultationContent slug={slug} />
}