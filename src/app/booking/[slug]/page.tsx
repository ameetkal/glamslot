'use client'

import React, { useState, use, useEffect } from 'react'
import { salonService, serviceService, providerService } from '@/lib/firebase/services'
import { SessionTrackingService } from '@/lib/sessionTracking'
import { Salon, Service, Provider, ProviderService } from '@/types/firebase'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

const OTHER_PROVIDER_ID = 'other'

function getMapping(provider: Provider, serviceId: string): ProviderService | undefined {
  return provider.services.find((ps) => ps.serviceId === serviceId)
}

// Validation functions
function validateName(name: string): string | undefined {
  if (!name.trim()) return 'Please enter your full name'
  if (name.trim().length < 2) return 'Name must be at least 2 characters'
  return undefined
}

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Please enter a valid email address'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'Please enter a valid email address'
  return undefined
}

function validatePhone(phone: string): string | undefined {
  if (!phone.trim()) return 'Please enter a phone number'
  const digitsOnly = phone.replace(/\D/g, '')
  if (digitsOnly.length < 10) return 'Please enter a phone number with at least 10 digits'
  return undefined
}

function validateService(selectedServices: string[], otherService: string, isOtherSelected: boolean, services: Service[]): string | undefined {
  if (services.length === 0) {
    if (!otherService.trim()) return 'Please describe the service(s) you want'
  } else {
    if (selectedServices.length === 0 && !otherService.trim()) return 'Please select at least one service or describe what you want'
    if (isOtherSelected && !otherService.trim()) return 'Please describe the service you want'
  }
  return undefined
}

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [step, setStep] = useState<Step>(1)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [otherService, setOtherService] = useState('')
  const [isOtherSelected, setIsOtherSelected] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'any' | string>('any')
  const [otherProvider, setOtherProvider] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    dateTimePreference: '',
    notes: '',
    waitlistOptIn: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    name?: string
    email?: string
    phone?: string
    service?: string
  }>({})
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  
  // Data from Firestore
  const [salon, setSalon] = useState<Salon | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch salon, services, and providers data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch salon by slug
        const salonData = await salonService.getSalonBySlug(slug)
        if (!salonData) {
          setError('Salon not found')
          return
        }
        setSalon(salonData)
        
        // Track session start
        const sessionTracking = SessionTrackingService.getInstance()
        await sessionTracking.trackSessionStart(
          salonData.id, 
          navigator.userAgent,
          undefined, // IP address would be available server-side
          document.referrer
        )
        
        // Fetch services and providers for this salon
        const [servicesData, providersData] = await Promise.all([
          serviceService.getServices(salonData.id),
          providerService.getProviders(salonData.id)
        ])
        
        setServices(servicesData)
        setProviders(providersData)
      } catch (error) {
        console.error('Error fetching booking data:', error)
        setError('Failed to load booking information')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug])

  // Providers for the selected services
  const providerOptions = selectedServices.length > 0 
    ? providers.filter(provider => 
        selectedServices.some(serviceId => 
          provider.services.some(ps => ps.serviceId === serviceId)
        )
      )
    : providers

  // Mapping for selected provider/service
  const selectedProviderData = selectedProvider !== 'any' && selectedProvider !== OTHER_PROVIDER_ID
    ? providers.find(p => p.id === selectedProvider)
    : null
  const mapping = selectedServices.length > 0 && selectedProviderData
    ? getMapping(selectedProviderData, selectedServices[0])
    : null

  function handleNext() {
    // Clear previous validation errors when moving to next step
    setShowValidationErrors(false)
    setValidationErrors({})
    
    if (step === 1) {
      // Validate service selection
      if (!validateCurrentStep()) {
        return // Don't proceed if validation fails
      }
      
      // Track form start when user selects a service
      if (salon) {
        const sessionTracking = SessionTrackingService.getInstance()
        sessionTracking.trackFormStart(salon.id)
      }
      setStep(2)
    }
    else if (step === 2 && (selectedProvider || (providerOptions.length === 0 && otherProvider.trim()))) {
      // Track form progress
      if (salon) {
        const sessionTracking = SessionTrackingService.getInstance()
        sessionTracking.trackFormProgress(salon.id, 2, {
          service: getServiceName(),
          provider: getProviderName()
        })
      }
      setStep(3)
    }
    else if (step === 3 && form.dateTimePreference) {
      // Track form progress
      if (salon) {
        const sessionTracking = SessionTrackingService.getInstance()
        sessionTracking.trackFormProgress(salon.id, 3, {
          service: getServiceName(),
          provider: getProviderName()
        })
      }
      setStep(4)
    }
    else if (step === 4) {
      // Notes step - no validation needed
      setStep(5)
    }
    else if (step === 5) {
      // Validate name
      if (!validateCurrentStep()) {
        return // Don't proceed if validation fails
      }
      setStep(6)
    }
    else if (step === 6) {
      // Validate email
      if (!validateCurrentStep()) {
        return // Don't proceed if validation fails
      }
      setStep(7)
    }
    else if (step === 7) {
      // Validate phone
      if (!validateCurrentStep()) {
        return // Don't proceed if validation fails
      }
      setStep(8)
    }
    else if (step === 8) setStep(9)
  }
  function handleBack() {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    try {
      if (!salon) {
        throw new Error('Salon information not available')
      }

      // Prepare booking data
      const bookingData = {
        service: getServiceName(),
        stylist: getProviderName(),
        dateTimePreference: form.dateTimePreference,
        name: form.name,
        phone: form.phone,
        email: form.email,
        notes: form.notes,
        waitlistOptIn: form.waitlistOptIn,
        salonSlug: slug
      }

      // Submit to API
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit booking request')
      }

      const result = await response.json()
      
      if (result.success) {
        // Track form completion
        if (salon) {
          const sessionTracking = SessionTrackingService.getInstance()
          sessionTracking.trackFormComplete(salon.id)
        }
        setStep(9)
      } else {
        throw new Error(result.message || 'Failed to submit booking request')
      }
    } catch (error) {
      console.error('Booking submission error:', error)
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to get service name
  const getServiceName = () => {
    const selectedServiceNames = services
      .filter(s => selectedServices.includes(s.id))
      .map(s => s.name)
    
    const allServices = [...selectedServiceNames]
    if (otherService.trim()) {
      allServices.push(otherService.trim())
    }
    
    return allServices.length > 0 ? allServices.join(', ') : 'No service selected'
  }

  // Helper function to get provider name
  const getProviderName = () => {
    if (selectedProvider === 'any') {
      // If no provider options and user entered text, return that text
      if (providerOptions.length === 0 && otherProvider.trim()) {
        return otherProvider.trim()
      }
      return 'Any service provider'
    }
    if (selectedProvider === OTHER_PROVIDER_ID) return otherProvider.trim()
    return providers.find(p => p.id === selectedProvider)?.name || otherProvider.trim()
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim()
    }
    return `${mins}m`
  }

  // Validation functions
  const validateCurrentStep = (): boolean => {
    const errors: typeof validationErrors = {}
    
    if (step === 1) {
      const serviceError = validateService(selectedServices, otherService, isOtherSelected, services)
      if (serviceError) errors.service = serviceError
    } else if (step === 5) {
      const nameError = validateName(form.name)
      if (nameError) errors.name = nameError
    } else if (step === 6) {
      const emailError = validateEmail(form.email)
      if (emailError) errors.email = emailError
    } else if (step === 7) {
      const phoneError = validatePhone(form.phone)
      if (phoneError) errors.phone = phoneError
    }
    
    setValidationErrors(errors)
    setShowValidationErrors(true)
    
    return Object.keys(errors).length === 0
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNext()
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-4 sm:p-6 mt-2 sm:mt-8 mx-2 sm:mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-4 sm:p-6 mt-2 sm:mt-8 mx-2 sm:mx-auto">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Booking Unavailable</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-4 sm:p-6 mt-2 sm:mt-8 mx-2 sm:mx-auto">
      {/* Salon Name Header */}
      <div className="text-center mb-4 sm:mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{salon?.name || 'Salon'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Step 1: Service Selection */}
        {step === 1 && (
          <>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Request an Appointment</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What service(s) would you like?</label>
              {services.length === 0 ? (
                <input
                  type="text"
                  autoFocus
                  className={`w-full border rounded-lg px-3 sm:px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 ${
                    showValidationErrors && validationErrors.service ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Please describe the service(s) you want"
                  value={otherService}
                  onChange={e => setOtherService(e.target.value)}
                  onKeyPress={handleKeyPress}
                  required
                />
              ) : (
                <>
                  <div className="space-y-3">
                    {services.map((service) => (
                      <label key={service.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServices([...selectedServices, service.id])
                            } else {
                              setSelectedServices(selectedServices.filter(id => id !== service.id))
                            }
                            setSelectedProvider('any')
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-900">{service.name}</span>
                      </label>
                    ))}
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOtherSelected}
                        onChange={(e) => {
                          setIsOtherSelected(e.target.checked)
                          if (!e.target.checked) {
                            setOtherService('')
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900">Other (please specify)</span>
                    </label>
                  </div>
                  {isOtherSelected && (
                    <input
                      type="text"
                      autoFocus
                      className={`mt-3 w-full border rounded-lg px-3 sm:px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 ${
                        showValidationErrors && validationErrors.service ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Please describe the service(s) you want"
                      value={otherService}
                      onChange={e => {
                        setOtherService(e.target.value)
                        if (e.target.value.trim() !== '' && !isOtherSelected) {
                          setIsOtherSelected(true)
                        }
                      }}
                      onKeyPress={handleKeyPress}
                      required
                    />
                  )}
                </>
              )}
              {showValidationErrors && validationErrors.service && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.service}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                className="px-4 sm:px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base min-h-[44px] w-full sm:w-auto"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </>
        )}
        {/* Step 2: Service Provider Preference */}
        {step === 2 && (
          <>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Who would you prefer?</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Provider Preference</label>
              {providerOptions.length === 0 ? (
                <input
                  type="text"
                  autoFocus
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500"
                  placeholder="Enter service provider preference (optional)"
                  value={otherProvider}
                  onChange={e => setOtherProvider(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              ) : (
                <>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedProvider}
                    onChange={e => {
                      if (e.target.value === 'any') setSelectedProvider('any')
                      else if (e.target.value === OTHER_PROVIDER_ID) setSelectedProvider(OTHER_PROVIDER_ID)
                      else setSelectedProvider(e.target.value)
                    }}
                    required
                  >
                    <option value="any" className="text-gray-500 bg-white">Any</option>
                    {providerOptions.map((provider) => (
                      <option key={provider.id} value={provider.id} className="text-gray-900 bg-white">{provider.name}</option>
                    ))}
                    <option value={OTHER_PROVIDER_ID} className="text-gray-900 bg-white">Other (please specify)</option>
                  </select>
                  {selectedProvider === OTHER_PROVIDER_ID && (
                    <input
                      type="text"
                      className="mt-3 w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500"
                      placeholder="Enter service provider preference (optional)"
                      value={otherProvider}
                      onChange={e => setOtherProvider(e.target.value)}
                      required
                    />
                  )}
                </>
              )}
            </div>
            {selectedServices.length > 0 && selectedProvider !== 'any' && selectedProvider !== OTHER_PROVIDER_ID && mapping && (
              <div className="rounded bg-gray-50 p-3 text-sm text-gray-700 mt-2">
                <div>Service: <span className="font-medium">{getServiceName()}</span></div>
                <div>Estimated Duration: <span className="font-medium">{formatDuration(mapping.duration)}</span></div>
              </div>
            )}
            <div className="flex justify-between gap-2 mt-4">
              <button type="button" className="px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleBack}>Back</button>
              <button
                type="button"
                className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] flex-1 sm:flex-none"
                onClick={handleNext}
                disabled={
                  providerOptions.length > 0 && selectedProvider === OTHER_PROVIDER_ID && !otherProvider.trim()
                }
              >
                Next
              </button>
            </div>
          </>
        )}
        {/* Step 3: Preferred Date & Time */}
        {step === 3 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred date(s) & time(s) for your appointment</label>
              <p className="text-sm text-gray-600 mb-3">
                Please note that we cannot guarantee your date/time but we will do our best to match your preferences and will reach out to confirm details.
              </p>
              <textarea
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-y placeholder:text-gray-500"
                value={form.dateTimePreference}
                onChange={e => setForm({ ...form, dateTimePreference: e.target.value })}
                placeholder="e.g., &apos;Weekdays after 5pm&apos;, &apos;Saturday mornings&apos;, &apos;Any time next week&apos;, &apos;Prefer Tuesday or Thursday evenings&apos;"
                required
              />
            </div>
            <div className="flex justify-between gap-2 mt-4">
              <button type="button" className="px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleBack}>Back</button>
              <button type="button" className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleNext} disabled={!form.dateTimePreference}>
                Next
              </button>
            </div>
          </>
        )}
        {/* Step 4: Notes */}
        {step === 4 && (
          <>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Additional Notes (Optional)</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Any additional notes or preferences?</label>
              <p className="text-sm text-gray-600 mb-3">
                Feel free to share any special requests, allergies, previous experiences, or other information that might help us better serve you.
              </p>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-y placeholder:text-gray-500"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g., &apos;I have sensitive skin&apos;, &apos;This is for a special occasion&apos;, &apos;I prefer natural products&apos;, &apos;I&apos;m a returning client&apos;, etc."
              />
            </div>
            <div className="flex justify-between gap-2 mt-4">
              <button type="button" className="px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleBack}>Back</button>
              <button type="button" className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleNext}>
                Next
              </button>
            </div>
          </>
        )}
        {/* Step 5: Name */}
        {step === 5 && (
          <>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">What&apos;s your name?</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                autoFocus
                className={`w-full border rounded-lg px-3 sm:px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  showValidationErrors && validationErrors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                onKeyPress={handleKeyPress}
                placeholder="Enter your full name"
                required
              />
              {showValidationErrors && validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>
            <div className="flex justify-between gap-2 mt-6">
              <button type="button" className="px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleBack}>Back</button>
              <button type="button" className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleNext}>
                Next
              </button>
            </div>
          </>
        )}
        {/* Step 6: Email */}
        {step === 6 && (
          <>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">What&apos;s your email?</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                autoFocus
                className={`w-full border rounded-lg px-3 sm:px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  showValidationErrors && validationErrors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onKeyPress={handleKeyPress}
                placeholder="Enter your email address"
                required
              />
              {showValidationErrors && validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>
            <div className="flex justify-between gap-2 mt-6">
              <button type="button" className="px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleBack}>Back</button>
              <button type="button" className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleNext}>
                Next
              </button>
            </div>
          </>
        )}
        {/* Step 7: Phone */}
        {step === 7 && (
          <>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">What&apos;s your phone number?</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                autoFocus
                className={`w-full border rounded-lg px-3 sm:px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  showValidationErrors && validationErrors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                onKeyPress={handleKeyPress}
                placeholder="Enter your phone number"
                required
              />
              {showValidationErrors && validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
              )}
            </div>
            <div className="flex justify-between gap-2 mt-6">
              <button type="button" className="px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleBack}>Back</button>
              <button type="button" className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleNext}>
                Next
              </button>
            </div>
          </>
        )}
        {/* Step 8: Review Request */}
        {step === 8 && (
          <>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Review Your Request</h2>
            
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> {submitError}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Service:</span>
                  <span className="ml-2 text-sm text-gray-900">{getServiceName()}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Service Provider Preference:</span>
                  <span className="ml-2 text-sm text-gray-900">{getProviderName()}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Preferred Date/Time:</span>
                  <span className="ml-2 text-sm text-gray-900">{form.dateTimePreference}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-sm text-gray-900">{form.name}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Phone:</span>
                  <span className="ml-2 text-sm text-gray-900">{form.phone}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-sm text-gray-900">{form.email}</span>
                </div>
                {form.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Additional Notes:</span>
                    <span className="ml-2 text-sm text-gray-900">{form.notes}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> This is a booking request, not a confirmed appointment. The salon will review your request and contact you to confirm details and finalize your appointment.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2 mt-4">
              <input
                type="checkbox"
                id="waitlistOptIn"
                checked={form.waitlistOptIn}
                onChange={e => setForm({ ...form, waitlistOptIn: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
              />
              <label htmlFor="waitlistOptIn" className="text-sm text-gray-700">
                Include me in the waitlist for future appointment gaps that open up in my preferred window
              </label>
            </div>
            
            <div className="flex justify-between gap-2 mt-4">
              <button type="button" className="px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleBack}>Back</button>
              <button type="submit" className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] flex-1 sm:flex-none" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </>
        )}
        {/* Step 9: Confirmation */}
        {step === 9 && (
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Your appointment request has been sent to the salon. We&apos;ll review your preferences and contact you soon to confirm details and finalize your appointment.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Don&apos;t want to wait?</h3>
              <p className="text-blue-800 mb-4">
                Call us directly to discuss availability and book your appointment right away:
              </p>
              <a 
                href={`tel:${salon?.ownerPhone || '+1234567890'}`}
                className="inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-auto"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call {salon?.ownerPhone || '(123) 456-7890'}
              </a>
            </div>
            
            <p className="text-sm text-gray-500">
              You can also check your email for updates on your request.
            </p>
          </div>
        )}
      </form>
    </div>
  )
} 