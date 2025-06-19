'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'

// Mock data for services, providers, and mappings
const services = [
  { id: 1, name: 'Haircut' },
  { id: 2, name: 'Color' },
  { id: 3, name: 'Balayage' },
]
const providers = [
  { id: 1, name: 'Alice Smith' },
  { id: 2, name: 'Bob Johnson' },
]
const providerServices = [
  { providerId: 1, serviceId: 1, duration: 45, isSpecialty: true, requiresConsultation: false },
  { providerId: 1, serviceId: 2, duration: 100, isSpecialty: false, requiresConsultation: true },
  { providerId: 2, serviceId: 1, duration: 50, isSpecialty: false, requiresConsultation: false },
  { providerId: 2, serviceId: 3, duration: 130, isSpecialty: true, requiresConsultation: true },
]

type Provider = typeof providers[number]
type ProviderService = typeof providerServices[number]

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

const OTHER_SERVICE_ID = 9999
const OTHER_PROVIDER_ID = 9999

function getProvidersForService(serviceId: number): Provider[] {
  return providers.filter((p) => providerServices.some((ps) => ps.providerId === p.id && ps.serviceId === serviceId))
}
function getMapping(providerId: number, serviceId: number): ProviderService | undefined {
  return providerServices.find((ps) => ps.providerId === providerId && ps.serviceId === serviceId)
}

export default function BookingPage() {
  const params = useParams()
  const salonSlug = params.slug as string
  
  const [step, setStep] = useState<Step>(1)
  const [selectedService, setSelectedService] = useState<number | null>(null)
  const [otherService, setOtherService] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<'any' | number>('any')
  const [otherProvider, setOtherProvider] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    dateTimePreference: '',
    notes: '',
    waitlistOptIn: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Providers for the selected service
  const providerOptions = selectedService && selectedService !== OTHER_SERVICE_ID ? getProvidersForService(selectedService) : providers
  // Mapping for selected provider/service
  const mapping = selectedService && selectedService !== OTHER_SERVICE_ID && selectedProvider !== 'any' && selectedProvider !== OTHER_PROVIDER_ID
    ? getMapping(selectedProvider as number, selectedService)
    : null

  function handleNext() {
    if (step === 1 && (selectedService || (services.length === 0 && otherService.trim()))) setStep(2)
    else if (step === 2 && (selectedProvider || (providerOptions.length === 0 && otherProvider.trim()))) setStep(3)
    else if (step === 3 && form.dateTimePreference) setStep(4)
    else if (step === 4 && form.name && form.phone && form.email) setStep(5)
    else if (step === 5) setStep(6)
    else if (step === 6) setStep(7)
  }
  function handleBack() {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    try {
      // Prepare booking data
      const bookingData = {
        service: getServiceName(),
        stylist: getProviderName(),
        dateTimePreference: form.dateTimePreference,
        name: form.name,
        phone: form.phone,
        email: form.email,
        notes: form.notes,
        waitlistOptIn: form.waitlistOptIn
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
        setStep(7)
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
    if (selectedService === OTHER_SERVICE_ID || !selectedService) return otherService
    return services.find(s => s.id === selectedService)?.name || otherService
  }

  // Helper function to get provider name
  const getProviderName = () => {
    if (selectedProvider === 'any') return 'Any stylist'
    if (selectedProvider === OTHER_PROVIDER_ID) return otherProvider
    return providers.find(p => p.id === selectedProvider)?.name || otherProvider
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-4 sm:p-6 mt-2 sm:mt-8 mx-2 sm:mx-auto">
      {/* Salon Name Header */}
      <div className="text-center mb-4 sm:mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Elegant Cuts Salon</h1>
        <p className="text-sm text-gray-700 mt-1">Professional Hair & Beauty Services</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Step 1: Service Selection */}
        {step === 1 && (
          <>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Request an Appointment</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
              {services.length === 0 ? (
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 sm:px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please describe the service you want"
                  value={otherService}
                  onChange={e => setOtherService(e.target.value)}
                  required
                />
              ) : (
                <>
                  <select
                    className="w-full border rounded-lg px-3 sm:px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedService ?? ''}
                    onChange={e => {
                      const val = Number(e.target.value)
                      setSelectedService(val)
                      setSelectedProvider('any')
                      if (val !== OTHER_SERVICE_ID) setOtherService('')
                    }}
                    required
                  >
                    <option value="" disabled>Select a service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                    <option value={OTHER_SERVICE_ID}>Other (please specify)</option>
                  </select>
                  {selectedService === OTHER_SERVICE_ID && (
                    <input
                      type="text"
                      className="mt-3 w-full border rounded-lg px-3 sm:px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Please describe the service you want"
                      value={otherService}
                      onChange={e => setOtherService(e.target.value)}
                      required
                    />
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                className="px-4 sm:px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base min-h-[44px] w-full sm:w-auto"
                onClick={handleNext}
                disabled={
                  (services.length === 0 && !otherService.trim()) ||
                  (services.length > 0 && (!selectedService || (selectedService === OTHER_SERVICE_ID && !otherService.trim())))
                }
              >
                Next
              </button>
            </div>
          </>
        )}
        {/* Step 2: Stylist Preference */}
        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stylist Preference</label>
              {providerOptions.length === 0 ? (
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 sm:px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter stylist preference (optional)"
                  value={otherProvider}
                  onChange={e => setOtherProvider(e.target.value)}
                />
              ) : (
                <>
                  <select
                    className="w-full border rounded-lg px-3 sm:px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedProvider}
                    onChange={e => {
                      if (e.target.value === 'any') setSelectedProvider('any')
                      else if (Number(e.target.value) === OTHER_PROVIDER_ID) setSelectedProvider(OTHER_PROVIDER_ID)
                      else setSelectedProvider(Number(e.target.value))
                    }}
                    required
                  >
                    <option value="any">Any</option>
                    {providerOptions.map((provider) => (
                      <option key={provider.id} value={provider.id}>{provider.name}</option>
                    ))}
                    <option value={OTHER_PROVIDER_ID}>Other (please specify)</option>
                  </select>
                  {selectedProvider === OTHER_PROVIDER_ID && (
                    <input
                      type="text"
                      className="mt-3 w-full border rounded-lg px-3 sm:px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter stylist preference (optional)"
                      value={otherProvider}
                      onChange={e => setOtherProvider(e.target.value)}
                      required
                    />
                  )}
                </>
              )}
            </div>
            {selectedService && selectedProvider !== 'any' && selectedProvider !== OTHER_PROVIDER_ID && mapping && (
              <div className="rounded bg-gray-50 p-3 text-sm text-gray-700 mt-2">
                <div>Service: <span className="font-medium">{services.find(s => s.id === selectedService)?.name}</span></div>
                <div>Estimated Duration: <span className="font-medium">{mapping.duration} min</span></div>
              </div>
            )}
            <div className="flex justify-between gap-2 mt-4">
              <button type="button" className="px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleBack}>Back</button>
              <button
                type="button"
                className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] flex-1 sm:flex-none"
                onClick={handleNext}
                disabled={
                  (providerOptions.length === 0 && !otherProvider.trim()) ||
                  (providerOptions.length > 0 && (!selectedProvider || (selectedProvider === OTHER_PROVIDER_ID && !otherProvider.trim())))
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
                className="w-full border rounded-lg px-3 sm:px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-y"
                value={form.dateTimePreference}
                onChange={e => setForm({ ...form, dateTimePreference: e.target.value })}
                placeholder="e.g., 'Weekdays after 5pm', 'Saturday mornings', 'Any time next week', 'Prefer Tuesday or Thursday evenings'"
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
        {/* Step 4: Contact Info */}
        {step === 4 && (
          <>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 sm:px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                className="w-full border rounded-lg px-3 sm:px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                className="w-full border rounded-lg px-3 sm:px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="waitlistOptIn"
                checked={form.waitlistOptIn}
                onChange={e => setForm({ ...form, waitlistOptIn: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500 mt-1"
              />
              <label htmlFor="waitlistOptIn" className="text-sm text-gray-700">
                Include me in the waitlist for future appointment gaps that open up in my preferred window
              </label>
            </div>
            <div className="flex justify-between gap-2 mt-4">
              <button type="button" className="px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleBack}>Back</button>
              <button type="button" className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleNext} disabled={!form.name || !form.phone || !form.email}>
                Next
              </button>
            </div>
          </>
        )}
        {/* Step 5: Notes */}
        {step === 5 && (
          <>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Additional Notes (Optional)</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Any additional notes or preferences?</label>
              <p className="text-sm text-gray-600 mb-3">
                Feel free to share any special requests, allergies, previous experiences, or other information that might help us better serve you.
              </p>
              <textarea
                className="w-full border rounded-lg px-3 sm:px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-y"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g., 'I have sensitive skin', 'This is for a special occasion', 'I prefer natural products', 'I'm a returning client', etc."
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
        {/* Step 6: Review Request */}
        {step === 6 && (
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
                  <span className="text-sm font-medium text-gray-700">Stylist Preference:</span>
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
                {form.waitlistOptIn && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Waitlist:</span>
                    <span className="ml-2 text-sm text-gray-900">Yes, include me on waitlist</span>
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
            
            <div className="flex justify-between gap-2 mt-4">
              <button type="button" className="px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 min-h-[44px] flex-1 sm:flex-none" onClick={handleBack}>Back</button>
              <button type="submit" className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] flex-1 sm:flex-none" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </>
        )}
        {/* Step 7: Confirmation */}
        {step === 7 && (
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
                href="tel:+1234567890" 
                className="inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-auto"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call (123) 456-7890
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