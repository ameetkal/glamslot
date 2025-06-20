'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  ClockIcon, 
  ChatBubbleLeftIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

// Mock data for booking requests
const bookingRequests = [
  {
    id: 1,
    clientName: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '555-123-4567',
    service: 'Haircut & Style',
    date: '2024-01-15',
    time: '2:00 PM',
    duration: '60 minutes',
    price: 85,
    notes: 'First time client, wants a consultation about color options',
    status: 'pending',
    requestedAt: '2 hours ago'
  },
  {
    id: 2,
    clientName: 'Mike Chen',
    email: 'mike.chen@email.com',
    phone: '555-987-6543',
    service: 'Beard Trim',
    date: '2024-01-16',
    time: '10:30 AM',
    duration: '30 minutes',
    price: 25,
    notes: 'Regular client, prefers Bob',
    status: 'pending',
    requestedAt: '1 hour ago'
  },
  {
    id: 3,
    clientName: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    phone: '555-456-7890',
    service: 'Full Color Treatment',
    date: '2024-01-17',
    time: '3:30 PM',
    duration: '120 minutes',
    price: 150,
    notes: 'Wants to go from brunette to blonde, needs consultation',
    status: 'pending',
    requestedAt: '30 minutes ago'
  }
]

type BookingRequest = typeof bookingRequests[0]

export default function BookingRequestsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>(bookingRequests)
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [notBookedReason, setNotBookedReason] = useState('')
  const [showReasonForm, setShowReasonForm] = useState(false)

  const handleRequestAction = async (requestId: number, action: 'booked' | 'not-booked') => {
    if (action === 'not-booked') {
      setShowReasonForm(true)
      return
    }

    setIsProcessing(true)
    try {
      // In a real app, this would make an API call
      console.log(`Marking appointment as ${action}:`, requestId)
      
      // Update the request status
      setRequests(requests.map(request => 
        request.id === requestId 
          ? { ...request, status: action === 'booked' ? 'booked' : 'not-booked' }
          : request
      ))

      // If there was a selected request, update it
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? {
          ...prev,
          status: action === 'booked' ? 'booked' : 'not-booked'
        } : null)
      }

      // Show success message
      alert(`Appointment marked as ${action === 'booked' ? 'booked' : 'not booked'} successfully!`)
    } catch (error) {
      console.error(`Error updating appointment status:`, error)
      alert(`Failed to update appointment status. Please try again.`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNotBookedSubmit = async () => {
    if (!selectedRequest || !notBookedReason.trim()) {
      alert('Please provide a reason why the appointment was not booked.')
      return
    }

    setIsProcessing(true)
    try {
      // In a real app, this would make an API call with the reason
      console.log(`Marking appointment as not booked with reason:`, notBookedReason)
      
      // Update the request status
      setRequests(requests.map(request => 
        request.id === selectedRequest.id 
          ? { ...request, status: 'not-booked', notes: `${request.notes || ''}\n\nNot Booked Reason: ${notBookedReason}` }
          : request
      ))

      // Update selected request
      setSelectedRequest(prev => prev ? {
        ...prev,
        status: 'not-booked',
        notes: `${prev.notes || ''}\n\nNot Booked Reason: ${notBookedReason}`
      } : null)

      // Reset form
      setNotBookedReason('')
      setShowReasonForm(false)

      // Show success message
      alert('Appointment marked as not booked successfully!')
    } catch (error) {
      console.error(`Error updating appointment status:`, error)
      alert(`Failed to update appointment status. Please try again.`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelNotBooked = () => {
    setNotBookedReason('')
    setShowReasonForm(false)
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
                      {request.status === 'booked' && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Booked
                        </span>
                      )}
                      {request.status === 'not-booked' && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          Not Booked
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
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            handleRequestAction(request.id, 'booked')
                          }}
                          disabled={isProcessing}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            handleRequestAction(request.id, 'not-booked')
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
                    <h3 className="text-sm font-medium text-gray-700">Client Information</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{selectedRequest.clientName}</span>
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
                    <h3 className="text-sm font-medium text-gray-700">Appointment Details</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">
                          {selectedRequest.date} at {selectedRequest.time} ({selectedRequest.duration})
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">Service:</span> <span className="text-gray-900">{selectedRequest.service}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">Price:</span> <span className="text-gray-900">${selectedRequest.price}</span>
                      </div>
                    </div>
                  </div>

                  {selectedRequest.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Notes</h3>
                      <div className="mt-2 flex items-start gap-2 text-sm">
                        <ChatBubbleLeftIcon className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.notes}</p>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === 'pending' && (
                    <div className="mt-6">
                      {!showReasonForm ? (
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1 bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700 focus:ring-green-500"
                            onClick={() => handleRequestAction(selectedRequest.id, 'booked')}
                            disabled={isProcessing}
                          >
                            Appointment Booked
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleRequestAction(selectedRequest.id, 'not-booked')}
                            disabled={isProcessing}
                          >
                            Not Booked
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Why was the appointment not booked?
                            </label>
                            <textarea
                              value={notBookedReason}
                              onChange={(e) => setNotBookedReason(e.target.value)}
                              className="w-full border rounded-md px-3 py-2 text-sm placeholder:text-gray-600"
                              rows={3}
                              placeholder="Please provide details about why this appointment was not booked..."
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              onClick={handleCancelNotBooked}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              variant={notBookedReason.trim() ? "primary" : "outline"}
                              onClick={handleNotBookedSubmit}
                              className={`flex-1 ${notBookedReason.trim() ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-gray-500'}`}
                              disabled={isProcessing || !notBookedReason.trim()}
                            >
                              {isProcessing ? 'Submitting...' : 'Submit'}
                            </Button>
                          </div>
                          {!notBookedReason.trim() && (
                            <p className="text-sm text-gray-500 text-center">
                              Please provide a reason before submitting
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedRequest.status === 'booked' && (
                    <div className="mt-6 rounded-md bg-green-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CheckIcon className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">Appointment Booked</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>
                              This appointment has been successfully booked in your system.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === 'not-booked' && (
                    <div className="mt-6 rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <XMarkIcon className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Appointment Not Booked</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>
                              This appointment was not booked. The client has been notified.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="mt-4 text-center text-gray-500">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">Select a request to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 