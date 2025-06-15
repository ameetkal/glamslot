'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'

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
    price: 65,
    status: 'pending',
    notes: 'First time client, would like a consultation before the cut',
    requestedAt: '10 minutes ago',
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
  },
]

type BookingRequest = typeof bookingRequests[0]

export default function BookingRequestsPage() {
  const [requests, setRequests] = useState(bookingRequests)
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRequestAction = async (requestId: number, action: 'accept' | 'decline') => {
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
                    <div className="mt-6 flex gap-3">
                      <Button
                        variant="primary"
                        className="flex-1"
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

                  {selectedRequest.status === 'declined' && (
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