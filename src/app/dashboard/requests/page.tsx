'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  CalendarIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface BookingRequest {
  id: string
  clientName: string
  clientEmail: string
  clientPhone: string
  service: string
  stylistPreference: string
  dateTimePreference: string
  waitlistOptIn: boolean
  status: 'pending' | 'booked' | 'not-booked'
  salonId: string
  createdAt: any
  updatedAt: any
}

export default function RequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return

      try {
        const requestsQuery = query(
          collection(db, 'bookingRequests'),
          where('salonId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
        const snapshot = await getDocs(requestsQuery)
        
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BookingRequest[]
        
        setRequests(requestsData)
      } catch (error) {
        console.error('Error fetching requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [user])

  const updateRequestStatus = async (requestId: string, status: 'booked' | 'not-booked') => {
    try {
      await updateDoc(doc(db, 'bookingRequests', requestId), {
        status,
        updatedAt: new Date().toISOString()
      })
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status, updatedAt: new Date().toISOString() } : req
      ))
      
      // Close modal if open
      setShowModal(false)
      setSelectedRequest(null)
    } catch (error) {
      console.error('Error updating request status:', error)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date'
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'booked':
        return 'bg-green-100 text-green-800'
      case 'not-booked':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading requests...</p>
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
              Manage and respond to client booking requests
            </p>
          </div>
        </div>

        <div className="mt-8">
          {requests.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <li key={request.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-accent-100 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-accent-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">
                                {request.clientName}
                              </p>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <EnvelopeIcon className="mr-1 h-4 w-4" />
                              {request.clientEmail}
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <CalendarIcon className="mr-1 h-4 w-4" />
                              {request.service} • {request.dateTimePreference}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request)
                              setShowModal(true)
                            }}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateRequestStatus(request.id, 'booked')}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Book
                              </button>
                              <button
                                onClick={() => updateRequestStatus(request.id, 'not-booked')}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <XMarkIcon className="h-4 w-4 mr-1" />
                                Decline
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No booking requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by sharing your booking URL with clients.
              </p>
            </div>
          )}
        </div>

        {/* Request Details Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Booking Request Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900">Client Information</h4>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <UserIcon className="h-4 w-4 mr-2" />
                            {selectedRequest.clientName}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <EnvelopeIcon className="h-4 w-4 mr-2" />
                            {selectedRequest.clientEmail}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <PhoneIcon className="h-4 w-4 mr-2" />
                            {selectedRequest.clientPhone}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900">Booking Details</h4>
                        <div className="mt-2 space-y-2">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Service:</span> {selectedRequest.service}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Stylist Preference:</span> {selectedRequest.stylistPreference || 'No preference'}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Preferred Date/Time:</span> {selectedRequest.dateTimePreference}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Waitlist Opt-in:</span> {selectedRequest.waitlistOptIn ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900">Request Information</h4>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            Submitted: {formatDate(selectedRequest.createdAt)}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Status:</span>{' '}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                              {selectedRequest.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  {selectedRequest.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateRequestStatus(selectedRequest.id, 'booked')}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm"
                      >
                        Book Appointment
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRequestStatus(selectedRequest.id, 'not-booked')}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                      >
                        Decline Request
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 sm:mt-0 sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 