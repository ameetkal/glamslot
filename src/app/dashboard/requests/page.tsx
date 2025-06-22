'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import { useAuth } from '@/lib/auth'
import { bookingRequestService } from '@/lib/firebase/services'
import { BookingRequest } from '@/types/firebase'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  ClockIcon, 
  ChatBubbleLeftIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function BookingRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [notBookedReason, setNotBookedReason] = useState('')
  const [showReasonForm, setShowReasonForm] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch booking requests from Firestore
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        const bookingRequests = await bookingRequestService.getBookingRequests(user.uid)
        setRequests(bookingRequests)
      } catch (error) {
        console.error('Error fetching booking requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [user])

  const handleRequestAction = async (requestId: string, action: 'booked' | 'not-booked' | 'pending') => {
    if (action === 'not-booked') {
      setShowReasonForm(true)
      return
    }

    setIsProcessing(true)
    try {
      // Update the request status in Firestore
      await bookingRequestService.updateBookingRequest(requestId, {
        status: action
      })
      
      // Update the local state
      setRequests(requests.map(request => 
        request.id === requestId 
          ? { ...request, status: action }
          : request
      ))

      // If there was a selected request, update it
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? {
          ...prev,
          status: action
        } : null)
      }

      // Show success message
      const statusTextMap = {
        booked: 'booked',
        'not-booked': 'not booked',
        pending: 'pending',
      } as const;
      const statusText = statusTextMap[action];
      alert(`Appointment marked as ${statusText} successfully!`)
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
      // Update the request status in Firestore with the reason
      await bookingRequestService.updateBookingRequest(selectedRequest.id, {
        status: 'not-booked',
        notes: `${selectedRequest.notes || ''}\n\nNot Booked Reason: ${notBookedReason}`
      })
      
      // Update the local state
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

  const formatTimeAgo = (dateString: string | Date | { toDate?: () => Date; getTime?: () => number }) => {
    let date: Date
    
    // Handle different date formats
    if (typeof dateString === 'string') {
      date = new Date(dateString)
    } else if (dateString instanceof Date) {
      date = dateString
    } else if (dateString && typeof dateString === 'object') {
      // Handle Firestore timestamp objects
      if ('toDate' in dateString && typeof dateString.toDate === 'function') {
        date = dateString.toDate()
      } else if ('getTime' in dateString && typeof dateString.getTime === 'function') {
        date = dateString as Date
      } else {
        // Fallback for other object types
        date = new Date(dateString as unknown as string)
      }
    } else {
      // Fallback for any other type
      date = new Date()
    }
    
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading booking requests...</p>
          </div>
        </div>
      </div>
    )
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

        {requests.length === 0 ? (
          <div className="mt-8 text-center">
            <div className="bg-white rounded-lg shadow p-8">
              <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No booking requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                When clients submit booking requests, they&apos;ll appear here.
              </p>
            </div>
          </div>
        ) : (
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
                        {request.status === 'pending' && (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{formatTimeAgo(request.createdAt)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">{request.service}</span>
                        {request.stylistPreference && request.stylistPreference !== 'Any stylist' && (
                          <span className="text-gray-500"> • {request.stylistPreference}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Request Details */}
            {selectedRequest && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Request Details</h2>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedRequest.clientName}</p>
                      <p className="text-sm text-gray-500">Client</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedRequest.clientEmail}</p>
                      <p className="text-sm text-gray-500">Email</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedRequest.clientPhone}</p>
                      <p className="text-sm text-gray-500">Phone</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Service Details</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">Service:</span> <span className="text-gray-800">{selectedRequest.service}</span>
                      </div>
                      {selectedRequest.stylistPreference && selectedRequest.stylistPreference !== 'Any stylist' && (
                        <div>
                          <span className="font-medium text-gray-900">Stylist Preference:</span> <span className="text-gray-800">{selectedRequest.stylistPreference}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-900">Date/Time Preference:</span> <span className="text-gray-800">{selectedRequest.dateTimePreference}</span>
                      </div>
                      {selectedRequest.waitlistOptIn && (
                        <div className="text-blue-700">
                          <span className="font-medium">✓</span> Client opted for waitlist
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedRequest.notes && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedRequest.notes}</p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Request Info</h3>
                    <div className="space-y-1 text-sm text-gray-800">
                      <div>Submitted: {formatTimeAgo(selectedRequest.createdAt)}</div>
                      <div>Status: <span className="font-medium capitalize">{selectedRequest.status}</span></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {selectedRequest.status === 'pending' && (
                    <div className="border-t pt-4 space-y-3">
                      <Button
                        onClick={() => handleRequestAction(selectedRequest.id, 'booked')}
                        disabled={isProcessing}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-4 w-4 mr-2" />
                            Appointment Made
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => handleRequestAction(selectedRequest.id, 'not-booked')}
                        disabled={isProcessing}
                        variant="outline"
                        className="w-full border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        Not Booked
                      </Button>
                    </div>
                  )}

                  {/* Change Status Section for Completed Requests */}
                  {(selectedRequest.status === 'booked' || selectedRequest.status === 'not-booked') && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">Change Status</h3>
                        <span className="text-xs text-gray-500">Need to update?</span>
                      </div>
                      <div className="space-y-2">
                        {selectedRequest.status === 'booked' && (
                          <Button
                            onClick={() => handleRequestAction(selectedRequest.id, 'not-booked')}
                            disabled={isProcessing}
                            variant="outline"
                            size="sm"
                            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                          >
                            <XMarkIcon className="h-4 w-4 mr-2" />
                            Mark as Not Booked
                          </Button>
                        )}
                        {selectedRequest.status === 'not-booked' && (
                          <Button
                            onClick={() => handleRequestAction(selectedRequest.id, 'booked')}
                            disabled={isProcessing}
                            variant="outline"
                            size="sm"
                            className="w-full border-green-300 text-green-700 hover:bg-green-50 text-sm"
                          >
                            <CheckIcon className="h-4 w-4 mr-2" />
                            Mark as Booked
                          </Button>
                        )}
                        <Button
                          onClick={() => handleRequestAction(selectedRequest.id, 'pending')}
                          disabled={isProcessing}
                          variant="outline"
                          size="sm"
                          className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50 text-sm"
                        >
                          <ClockIcon className="h-4 w-4 mr-2" />
                          Mark as Pending
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Not Booked Reason Modal */}
        {showReasonForm && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Why wasn&apos;t this booked?</h3>
              <textarea
                value={notBookedReason}
                onChange={(e) => setNotBookedReason(e.target.value)}
                placeholder="Enter the reason why this appointment wasn't booked..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                rows={4}
              />
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handleNotBookedSubmit}
                  disabled={!notBookedReason.trim() || isProcessing}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isProcessing ? 'Processing...' : 'Submit'}
                </Button>
                <Button
                  onClick={handleCancelNotBooked}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 