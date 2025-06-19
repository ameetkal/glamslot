'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import { FeedbackProcessor, type DeclineFeedback, type SystemUpdate } from '@/lib/feedbackProcessor'

// Mock data for the prototype
const bookingRequests = [
  {
    id: 1,
    clientName: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 123-4567',
    service: 'Haircut & Style',
    date: 'Today',
    time: '2:00 PM',
    duration: '45 min',
    price: 85,
    status: 'pending',
    notes: 'First time client, would like a consultation before the cut',
    requestedAt: '10 minutes ago',
    providerId: 1,
    serviceId: 1,
  },
  {
    id: 2,
    clientName: 'Mike Chen',
    email: 'mike.c@email.com',
    phone: '(555) 987-6543',
    service: 'Balayage',
    date: 'Today',
    time: '4:30 PM',
    duration: '2.5 hours',
    price: 185,
    status: 'pending',
    notes: '',
    requestedAt: '25 minutes ago',
    providerId: 2,
    serviceId: 3,
  },
  {
    id: 3,
    clientName: 'Emma Davis',
    email: 'emma.d@email.com',
    phone: '(555) 456-7890',
    service: 'Color & Cut',
    date: 'Tomorrow',
    time: '11:00 AM',
    duration: '2 hours',
    price: 135,
    status: 'accepted',
    notes: 'Regular client, prefers same stylist as last time',
    requestedAt: '1 hour ago',
    providerId: 1,
    serviceId: 2,
  },
]

type BookingRequest = typeof bookingRequests[0]

// Decline reason categories that can trigger system improvements
interface DeclineReason {
  id: string
  category: 'availability' | 'pricing' | 'service' | 'provider' | 'other'
  label: string
  description: string
  actionable: boolean
  suggestedAction?: string
}

const declineReasons: DeclineReason[] = [
  // Availability-related reasons
  {
    id: 'unavailable_time',
    category: 'availability',
    label: 'Requested time unavailable',
    description: 'The specific time requested is not available',
    actionable: true,
    suggestedAction: 'Consider adding more availability for this time slot'
  },
  {
    id: 'provider_unavailable',
    category: 'availability',
    label: 'Requested provider unavailable',
    description: 'The requested stylist is not available at this time',
    actionable: true,
    suggestedAction: 'Update provider availability or suggest alternative providers'
  },
  {
    id: 'insufficient_time',
    category: 'availability',
    label: 'Insufficient time for service',
    description: 'The requested time slot is too short for this service',
    actionable: true,
    suggestedAction: 'Adjust service duration estimates or block longer time slots'
  },
  
  // Pricing-related reasons
  {
    id: 'price_mismatch',
    category: 'pricing',
    label: 'Price discrepancy',
    description: 'The requested price doesn\'t match our current pricing',
    actionable: true,
    suggestedAction: 'Update service pricing in the system'
  },
  {
    id: 'consultation_required',
    category: 'pricing',
    label: 'Consultation required first',
    description: 'This service requires a consultation before booking',
    actionable: true,
    suggestedAction: 'Mark this service as requiring consultation'
  },
  
  // Service-related reasons
  {
    id: 'service_not_offered',
    category: 'service',
    label: 'Service not offered',
    description: 'We don\'t currently offer this service',
    actionable: true,
    suggestedAction: 'Add this service to the service catalog'
  },
  {
    id: 'service_discontinued',
    category: 'service',
    label: 'Service discontinued',
    description: 'This service is no longer offered',
    actionable: true,
    suggestedAction: 'Remove this service from the catalog'
  },
  {
    id: 'specialty_required',
    category: 'service',
    label: 'Specialist required',
    description: 'This service requires a specialist we don\'t have',
    actionable: true,
    suggestedAction: 'Add specialist provider or mark service as specialty-only'
  },
  
  // Provider-related reasons
  {
    id: 'provider_not_qualified',
    category: 'provider',
    label: 'Provider not qualified',
    description: 'The requested provider doesn\'t offer this service',
    actionable: true,
    suggestedAction: 'Update provider-service mappings'
  },
  {
    id: 'provider_left',
    category: 'provider',
    label: 'Provider no longer available',
    description: 'The requested provider is no longer with us',
    actionable: true,
    suggestedAction: 'Remove provider or update their status'
  },
  
  // Other reasons
  {
    id: 'client_request',
    category: 'other',
    label: 'Client requested cancellation',
    description: 'The client asked to cancel this request',
    actionable: false
  },
  {
    id: 'other',
    category: 'other',
    label: 'Other reason',
    description: 'Other reason not listed above',
    actionable: false
  }
]

// Type definitions for update data
interface ServiceDurationData {
  serviceId: number
  currentDuration?: number
  previousDuration?: number
  suggestedDuration?: number
  newDuration?: number
}

interface ServicePricingData {
  serviceId: number
  currentPrice?: number
  previousPrice?: number
  requestedPrice?: number
  newPrice?: number
}

interface ConsultationData {
  serviceId: number
  alreadyRequiresConsultation?: boolean
  requiresConsultation?: boolean
}

interface ProviderMappingData {
  serviceId: number
  action: string
  providerId?: number
}

export default function BookingRequestsPage() {
  const [requests, setRequests] = useState(bookingRequests)
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [declineStep, setDeclineStep] = useState<'initial' | 'category' | 'reason' | 'system-update' | 'complete'>('initial')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [declineReason, setDeclineReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [systemUpdates, setSystemUpdates] = useState<SystemUpdate[]>([])
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, string | number | boolean>>>({})

  const feedbackProcessor = FeedbackProcessor.getInstance()

  // Automatically process feedback when a reason is selected
  useEffect(() => {
    if (declineReason && selectedRequest && declineStep === 'reason') {
      // Process the feedback immediately when reason is selected
      const feedback: DeclineFeedback = {
        requestId: selectedRequest.id,
        reason: declineReason,
        customReason: customReason,
        actionable: declineReasons.find(r => r.id === declineReason)?.actionable || false,
        suggestedAction: declineReasons.find(r => r.id === declineReason)?.suggestedAction,
        requestData: {
          providerId: selectedRequest.providerId,
          serviceId: selectedRequest.serviceId,
          service: selectedRequest.service,
          duration: parseInt(selectedRequest.duration),
          price: selectedRequest.price,
          date: selectedRequest.date,
          time: selectedRequest.time,
        }
      }

      // Process feedback and get system updates
      const updates = feedbackProcessor.processDeclineFeedback(feedback)
      setSystemUpdates(updates)

      // Move to system update step if there are updates
      if (updates.length > 0) {
        setDeclineStep('system-update')
      }
    }
  }, [declineReason, selectedRequest, declineStep, customReason, feedbackProcessor])

  const handleRequestAction = async (requestId: number, action: 'accept' | 'decline') => {
    if (action === 'decline') {
      setDeclineStep('category')
      return
    }

    setIsProcessing(true)
    try {
      // In a real app, this would make an API call
      console.log(`${action}ing request:`, requestId)
      
      // Update the request status
      setRequests(requests.map(request => 
        request.id === requestId 
          ? { ...request, status: action === 'accept' ? 'accepted' : 'declined' }
          : request
      ))

      // If there was a selected request, update it
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? {
          ...prev,
          status: action === 'accept' ? 'accepted' : 'declined'
        } : null)
      }

      // Show success message (in a real app)
      alert(`Request ${action}ed successfully!`)
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      alert(`Failed to ${action} request. Please try again.`)
    } finally {
      setIsProcessing(false)
    }
  }

  const actuallyDeclineRequest = async () => {
    if (!selectedRequest) return

    // Update the request status
    setRequests(requests.map(request => 
      request.id === selectedRequest.id 
        ? { ...request, status: 'declined' }
        : request
    ))

    // Update the selected request
    setSelectedRequest(prev => prev ? {
      ...prev,
      status: 'declined'
    } : null)

    // Move to completion step
    setDeclineStep('complete')
  }

  const resetDeclineFlow = () => {
    setDeclineStep('initial')
    setSelectedCategory('')
    setDeclineReason('')
    setCustomReason('')
    setSystemUpdates([])
    setPendingChanges({})
  }

  const handleApplyUpdates = () => {
    // Apply the pending changes from the form
    Object.entries(pendingChanges).forEach(([key, changes]) => {
      if (key.startsWith('duration_')) {
        const serviceId = parseInt(key.replace('duration_', ''))
        const newDuration = changes.duration
        if (newDuration && typeof newDuration === 'number') {
          // Update service duration in the feedback processor
          feedbackProcessor.updateServiceDuration(serviceId, newDuration)
        }
      } else if (key.startsWith('price_')) {
        const serviceId = parseInt(key.replace('price_', ''))
        const newPrice = changes.price
        if (newPrice && typeof newPrice === 'number') {
          // Update service pricing in the feedback processor
          feedbackProcessor.updateServicePricing(serviceId, newPrice)
        }
      } else if (key.startsWith('consultation_')) {
        const serviceId = parseInt(key.replace('consultation_', ''))
        const requiresConsultation = changes.requiresConsultation
        if (typeof requiresConsultation === 'boolean') {
          // Update consultation requirement in the feedback processor
          feedbackProcessor.updateConsultationRequirement(serviceId, requiresConsultation)
        }
      }
    })
    
    // Now actually decline the request
    actuallyDeclineRequest()
    alert('System updates applied and request declined successfully!')
  }

  const handleDismissUpdates = () => {
    // Just decline the request without applying updates
    actuallyDeclineRequest()
    alert('Request declined successfully!')
  }

  const handleUpdateValue = (updateId: string, field: string, value: string | number | boolean) => {
    setPendingChanges(prev => ({
      ...prev,
      [updateId]: {
        ...prev[updateId],
        [field]: value
      }
    }))
  }

  const getReasonCategoryIcon = (category: string) => {
    switch (category) {
      case 'availability':
        return <CalendarIcon className="h-4 w-4" />
      case 'pricing':
        return <CurrencyDollarIcon className="h-4 w-4" />
      case 'service':
        return <WrenchScrewdriverIcon className="h-4 w-4" />
      case 'provider':
        return <UserIcon className="h-4 w-4" />
      default:
        return <ExclamationTriangleIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Booking Requests</h1>
            <p className="mt-2 text-sm text-gray-700">
              Review and manage incoming booking requests from clients
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Requests List */}
          <div className="space-y-4">
            {requests.map((request) => (
              <motion.div
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className={`w-full rounded-lg border p-4 text-left transition-all cursor-pointer ${
                  selectedRequest?.id === request.id
                    ? 'border-accent-500 bg-accent-50'
                    : 'border-gray-200 bg-white hover:border-accent-300'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {request.clientName}
                      </span>
                      {request.status === 'accepted' && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Accepted
                        </span>
                      )}
                      {request.status === 'declined' && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          Declined
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{request.date} at {request.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>${request.price}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {request.requestedAt}
                    </div>
                    {request.status === 'pending' && (
                      <div className="mt-1 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRequestAction(request.id, 'accept')
                          }}
                          disabled={isProcessing}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRequestAction(request.id, 'decline')
                          }}
                          disabled={isProcessing}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Request Details */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900">Request Details</h2>
            {selectedRequest ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Client Information</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span>{selectedRequest.clientName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${selectedRequest.email}`} className="text-accent-600 hover:text-accent-500">
                          {selectedRequest.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                        <a href={`tel:${selectedRequest.phone}`} className="text-accent-600 hover:text-accent-500">
                          {selectedRequest.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Appointment Details</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span>
                          {selectedRequest.date} at {selectedRequest.time} ({selectedRequest.duration})
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Service:</span> {selectedRequest.service}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Price:</span> ${selectedRequest.price}
                      </div>
                    </div>
                  </div>

                  {selectedRequest.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                      <div className="mt-2 flex items-start gap-2 text-sm">
                        <ChatBubbleLeftIcon className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-600">{selectedRequest.notes}</p>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === 'pending' && (
                    <div className="mt-6">
                      {declineStep === 'initial' && (
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1 bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700 focus:ring-green-500"
                            onClick={() => handleRequestAction(selectedRequest.id, 'accept')}
                            disabled={isProcessing}
                          >
                            Accept Request
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleRequestAction(selectedRequest.id, 'decline')}
                            disabled={isProcessing}
                          >
                            Decline Request
                          </Button>
                        </div>
                      )}

                      {declineStep === 'category' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">Select Decline Category</h4>
                            <button
                              onClick={resetDeclineFlow}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {Object.entries(
                              declineReasons.reduce((acc, reason) => {
                                if (!acc[reason.category]) acc[reason.category] = [];
                                acc[reason.category].push(reason);
                                return acc;
                              }, {} as Record<string, DeclineReason[]>)
                            ).map(([category, reasons]) => (
                              <button
                                key={category}
                                onClick={() => {
                                  setSelectedCategory(category)
                                  setDeclineStep('reason')
                                }}
                                className="flex items-center gap-3 p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                {getReasonCategoryIcon(category)}
                                <div>
                                  <div className="font-medium text-gray-900 capitalize">
                                    {category} Issues
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {reasons.length} reason{reasons.length !== 1 ? 's' : ''} available
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {declineStep === 'reason' && selectedCategory && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">Select Specific Reason</h4>
                            <button
                              onClick={() => setDeclineStep('category')}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              ← Back
                            </button>
                          </div>
                          <div className="space-y-3">
                            {declineReasons
                              .filter(reason => reason.category === selectedCategory)
                              .map((reason) => (
                                <label key={reason.id} className="flex items-start gap-3 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="declineReason"
                                    value={reason.id}
                                    checked={declineReason === reason.id}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                    className="mt-1 h-4 w-4 text-accent-600 focus:ring-accent-500"
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">{reason.label}</div>
                                    <div className="text-sm text-gray-600">{reason.description}</div>
                                    {reason.actionable && reason.suggestedAction && (
                                      <div className="mt-1 text-xs text-accent-600 bg-accent-50 p-2 rounded">
                                        💡 {reason.suggestedAction}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              ))}
                          </div>

                          {declineReason === 'other' && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Please specify the reason
                              </label>
                              <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm"
                                rows={3}
                                placeholder="Please provide details about why this request is being declined..."
                              />
                            </div>
                          )}

                          <div className="flex gap-3 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setDeclineStep('reason')
                                setDeclineReason('')
                                setSystemUpdates([])
                              }}
                              className="flex-1"
                            >
                              Back
                            </Button>
                          </div>
                        </div>
                      )}

                      {declineStep === 'system-update' && (
                        <div className="space-y-4">
                          {systemUpdates.length > 0 && (
                            <div className="rounded-md bg-accent-50 p-4">
                              <div className="flex items-center gap-2 mb-4">
                                <LightBulbIcon className="h-5 w-5 text-accent-600" />
                                <h4 className="text-sm font-medium text-accent-900">Update System Settings</h4>
                              </div>
                              <p className="text-sm text-accent-700 mb-4">
                                Based on your decline reason, we&apos;ve identified some potential improvements. 
                                Review and update the values below before declining this request:
                              </p>
                              
                              <div className="space-y-4">
                                {systemUpdates.map((update, index) => (
                                  <div key={index} className="bg-white p-4 rounded-lg border">
                                    <div className="flex items-center gap-2 mb-3">
                                      {update.type === 'service_duration' && <ClockIcon className="h-4 w-4 text-blue-600" />}
                                      {update.type === 'service_pricing' && <CurrencyDollarIcon className="h-4 w-4 text-green-600" />}
                                      {update.type === 'consultation_requirement' && <UserIcon className="h-4 w-4 text-purple-600" />}
                                      {update.type === 'provider_mapping' && <WrenchScrewdriverIcon className="h-4 w-4 text-orange-600" />}
                                      <h5 className="text-sm font-medium text-gray-900">
                                        {update.type === 'service_duration' && 'Service Duration'}
                                        {update.type === 'service_pricing' && 'Service Pricing'}
                                        {update.type === 'consultation_requirement' && 'Consultation Requirement'}
                                        {update.type === 'provider_mapping' && 'Provider Service Mapping'}
                                      </h5>
                                    </div>
                                    
                                    <div className="text-sm text-gray-600 mb-3">
                                      {update.description}
                                    </div>

                                    {/* Service Duration Update */}
                                    {update.type === 'service_duration' && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-4 text-sm">
                                          <span className="text-gray-500">Current:</span>
                                          <span className="font-medium">{(update.data as unknown as ServiceDurationData).currentDuration || (update.data as unknown as ServiceDurationData).previousDuration} minutes</span>
                                          <span className="text-gray-500">Requested:</span>
                                          <span className="font-medium">{(update.data as unknown as ServiceDurationData).suggestedDuration || (update.data as unknown as ServiceDurationData).newDuration} minutes</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <label className="text-sm font-medium text-gray-700">New Duration:</label>
                                          <input
                                            type="number"
                                            className="w-20 px-2 py-1 text-sm border rounded"
                                            defaultValue={(update.data as unknown as ServiceDurationData).suggestedDuration || (update.data as unknown as ServiceDurationData).newDuration}
                                            onChange={(e) => handleUpdateValue(`duration_${(update.data as unknown as ServiceDurationData).serviceId}`, 'duration', parseInt(e.target.value))}
                                          />
                                          <span className="text-sm text-gray-500">minutes</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Service Pricing Update */}
                                    {update.type === 'service_pricing' && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-4 text-sm">
                                          <span className="text-gray-500">Current:</span>
                                          <span className="font-medium">${(update.data as unknown as ServicePricingData).currentPrice || (update.data as unknown as ServicePricingData).previousPrice}</span>
                                          <span className="text-gray-500">Requested:</span>
                                          <span className="font-medium">${(update.data as unknown as ServicePricingData).requestedPrice || (update.data as unknown as ServicePricingData).newPrice}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <label className="text-sm font-medium text-gray-700">New Price:</label>
                                          <span className="text-sm text-gray-500">$</span>
                                          <input
                                            type="number"
                                            className="w-20 px-2 py-1 text-sm border rounded"
                                            defaultValue={(update.data as unknown as ServicePricingData).requestedPrice || (update.data as unknown as ServicePricingData).newPrice}
                                            onChange={(e) => handleUpdateValue(`price_${(update.data as unknown as ServicePricingData).serviceId}`, 'price', parseFloat(e.target.value))}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Consultation Requirement Update */}
                                    {update.type === 'consultation_requirement' && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-4 text-sm">
                                          <span className="text-gray-500">Current:</span>
                                          <span className="font-medium">{(update.data as unknown as ConsultationData).alreadyRequiresConsultation ? 'Required' : 'Not Required'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            id={`consultation_${(update.data as unknown as ConsultationData).serviceId}`}
                                            defaultChecked={(update.data as unknown as ConsultationData).requiresConsultation}
                                            onChange={(e) => handleUpdateValue(`consultation_${(update.data as unknown as ConsultationData).serviceId}`, 'requiresConsultation', e.target.checked)}
                                            className="h-4 w-4 text-accent-600 focus:ring-accent-500"
                                          />
                                          <label htmlFor={`consultation_${(update.data as unknown as ConsultationData).serviceId}`} className="text-sm font-medium text-gray-700">
                                            Require consultation for this service
                                          </label>
                                        </div>
                                      </div>
                                    )}

                                    {/* Provider Mapping Update */}
                                    {update.type === 'provider_mapping' && (
                                      <div className="space-y-2">
                                        <div className="text-sm text-gray-600">
                                          {(update.data as unknown as ProviderMappingData).action === 'removed' && 'Provider service mapping has been removed.'}
                                          {(update.data as unknown as ProviderMappingData).action === 'mark_specialty' && 'Service has been marked as specialty for all providers.'}
                                          {(update.data as unknown as ProviderMappingData).action === 'remove_provider' && 'All service mappings for this provider have been removed.'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          This change has been applied automatically.
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <div className="flex gap-3 pt-4 border-t">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setDeclineStep('reason')
                                    setDeclineReason('')
                                    setSystemUpdates([])
                                  }}
                                  className="flex-1"
                                >
                                  Back
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={handleDismissUpdates}
                                  className="flex-1"
                                >
                                  Decline Without Updates
                                </Button>
                                <Button
                                  variant="primary"
                                  onClick={handleApplyUpdates}
                                  className="flex-1"
                                >
                                  Apply Changes & Decline
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {declineStep === 'complete' && (
                        <div className="space-y-4">
                          <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <XMarkIcon className="h-5 w-5 text-red-400" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Request Declined</h3>
                                <div className="mt-2 text-sm text-red-700">
                                  <p>
                                    The client has been notified that this slot is no longer available.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {systemUpdates.length > 0 && (
                            <div className="rounded-md bg-accent-50 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <LightBulbIcon className="h-5 w-5 text-accent-600" />
                                <h4 className="text-sm font-medium text-accent-900">System Improvements Detected</h4>
                              </div>
                              <p className="text-sm text-accent-700 mb-3">
                                Based on your decline reason, we&apos;ve identified some potential improvements.
                              </p>
                              <div className="space-y-2">
                                {systemUpdates.slice(0, 2).map((update, index) => (
                                  <div key={index} className="text-xs text-accent-800 bg-white p-2 rounded border">
                                    {update.description}
                                  </div>
                                ))}
                                {systemUpdates.length > 2 && (
                                  <div className="text-xs text-accent-600">
                                    +{systemUpdates.length - 2} more improvement{systemUpdates.length - 2 !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleDismissUpdates}
                                >
                                  Dismiss
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={handleApplyUpdates}
                                >
                                  Apply Updates
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedRequest.status === 'accepted' && (
                    <div className="mt-6 rounded-md bg-green-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CheckIcon className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">Request Accepted</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>
                              The client has been notified. You can find this appointment in your calendar.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === 'declined' && declineStep === 'initial' && (
                    <div className="mt-6 rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <XMarkIcon className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Request Declined</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>
                              The client has been notified that this slot is no longer available.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="mt-6 text-center text-gray-500">
                Select a request to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 