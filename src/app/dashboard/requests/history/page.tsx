'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { teamService, consultationService } from '@/lib/firebase/services'
import Link from 'next/link'
import { 
  CalendarIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'
import { BookingRequest, ConsultationSubmission } from '@/types/firebase'
import ClickablePhone from '@/components/ui/ClickablePhone'

// Type alias to handle Firebase timestamp format
type BookingRequestWithFirebaseTimestamps = Omit<BookingRequest, 'createdAt' | 'updatedAt'> & {
  createdAt: Date | { toDate: () => Date }
  updatedAt: Date | { toDate: () => Date }
}

// Unified request type for history view
type UnifiedRequestHistory = (BookingRequestWithFirebaseTimestamps | ConsultationSubmission) & {
  requestType: 'booking' | 'consultation'
}

export default function RequestHistoryPage() {
  const { user } = useAuth()
  const [allRequests, setAllRequests] = useState<UnifiedRequestHistory[]>([])
  const [filteredRequests, setFilteredRequests] = useState<UnifiedRequestHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [requestTypeFilter, setRequestTypeFilter] = useState<'all' | 'bookings' | 'consultations'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'contacted' | 'reviewed' | 'booked' | 'not-booked'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  useEffect(() => {
    const fetchAllRequests = async () => {
      if (!user) return

      try {
        // Get the user's salon ID - check if they're a team member first
        const userTeamMember = await teamService.getTeamMemberByUserId(user.uid)
        const salonId = userTeamMember?.salonId || user.uid
        
        // Fetch both booking requests and consultation submissions
        const [bookingRequests, consultationSubmissions] = await Promise.all([
          // Fetch booking requests
          getDocs(query(
            collection(db, 'bookingRequests'),
            where('salonId', '==', salonId),
            orderBy('createdAt', 'desc')
          )).then(snapshot => 
            snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              requestType: 'booking' as const
            })) as (BookingRequest & { requestType: 'booking' })[]
          ),
          
          // Fetch consultation submissions
          consultationService.getConsultationSubmissions(salonId).then(consultations =>
            consultations.map(consultation => ({
              ...consultation,
              requestType: 'consultation' as const
            }))
          )
        ])
        
        // Combine and sort all requests by date (newest first)
        const allRequests: UnifiedRequestHistory[] = [...bookingRequests, ...consultationSubmissions]
        const sortedRequests = allRequests.sort((a, b) => {
          let dateA: Date
          let dateB: Date
          
          if (a.requestType === 'booking') {
            const booking = a as BookingRequestWithFirebaseTimestamps & { requestType: 'booking' }
            dateA = typeof booking.createdAt === 'object' && 'toDate' in booking.createdAt 
              ? booking.createdAt.toDate() 
              : new Date(booking.createdAt as string | Date)
          } else {
            const consultation = a as ConsultationSubmission & { requestType: 'consultation' }
            dateA = new Date(consultation.submittedAt)
          }
          
          if (b.requestType === 'booking') {
            const booking = b as BookingRequestWithFirebaseTimestamps & { requestType: 'booking' }
            dateB = typeof booking.createdAt === 'object' && 'toDate' in booking.createdAt 
              ? booking.createdAt.toDate() 
              : new Date(booking.createdAt as string | Date)
          } else {
            const consultation = b as ConsultationSubmission & { requestType: 'consultation' }
            dateB = new Date(consultation.submittedAt)
          }
          
          return dateB.getTime() - dateA.getTime()
        })
        
        setAllRequests(sortedRequests)
        setFilteredRequests(sortedRequests)
      } catch (error) {
        console.error('Error fetching requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllRequests()
  }, [user])

  useEffect(() => {
    // Filter requests based on search term, request type, and status filter
    let filtered = allRequests

    // Filter by request type
    if (requestTypeFilter !== 'all') {
      if (requestTypeFilter === 'bookings') {
        filtered = filtered.filter(req => req.requestType === 'booking')
      } else if (requestTypeFilter === 'consultations') {
        filtered = filtered.filter(req => req.requestType === 'consultation')
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(req => {
        if (req.requestType === 'booking') {
          const booking = req as BookingRequestWithFirebaseTimestamps & { requestType: 'booking' }
          return booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 booking.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 booking.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 booking.notes?.toLowerCase().includes(searchTerm.toLowerCase())
        } else {
          const consultation = req as ConsultationSubmission & { requestType: 'consultation' }
          return consultation.clientInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 consultation.clientInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 consultation.clientInfo.phone.includes(searchTerm) ||
                 'virtual consultation'.includes(searchTerm.toLowerCase())
        }
      })
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter)
    }

    setFilteredRequests(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, requestTypeFilter, statusFilter, allRequests])

  const updateRequestStatus = async (requestId: string, status: 'booked' | 'not-booked' | 'pending' | 'contacted', e?: React.MouseEvent) => {
    e?.stopPropagation()
    
    try {
      await updateDoc(doc(db, 'bookingRequests', requestId), {
        status,
        updatedAt: new Date()
      })
      
      // Update local state (only for booking requests)
      setAllRequests(prev => prev.map(req => 
        req.id === requestId && req.requestType === 'booking' ? { 
          ...req, 
          status, 
          updatedAt: new Date()
        } as UnifiedRequestHistory : req
      ))
    } catch (error) {
      console.error('Error updating request status:', error)
    }
  }

  const updateConsultationStatus = async (requestId: string, status: 'pending' | 'reviewed', e?: React.MouseEvent) => {
    e?.stopPropagation()
    
    try {
      await consultationService.updateConsultationStatus(requestId, status)
      
      // Update local state (only for consultation requests)
      setAllRequests(prev => prev.map(req => 
        req.id === requestId && req.requestType === 'consultation' ? { 
          ...req, 
          status, 
          updatedAt: new Date()
        } as UnifiedRequestHistory : req
      ))
    } catch (error) {
      console.error('Error updating consultation status:', error)
    }
  }

  const toggleExpanded = (requestId: string) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId)
  }

  const formatDate = (timestamp: Date | { toDate: () => Date } | string) => {
    if (!timestamp) return 'Unknown date'
    
    let date: Date
    if (typeof timestamp === 'string') {
      date = new Date(timestamp)
    } else if (typeof timestamp === 'object' && 'toDate' in timestamp) {
      date = timestamp.toDate()
    } else {
      date = timestamp as Date
    }
    
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
      case 'contacted':
        return 'bg-blue-100 text-blue-800'
      case 'booked':
        return 'bg-green-100 text-green-800'
      case 'not-booked':
        return 'bg-red-100 text-red-800'
      case 'reviewed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRequests = filteredRequests.slice(startIndex, endIndex)

  const renderRequestCard = (request: UnifiedRequestHistory) => {
    const isConsultation = request.requestType === 'consultation'
    const consultation = isConsultation ? request as ConsultationSubmission & { requestType: 'consultation' } : null
    const booking = !isConsultation ? request as BookingRequestWithFirebaseTimestamps & { requestType: 'booking' } : null
    
    return (
    <li key={request.id}>
      <div 
        className="px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => toggleExpanded(request.id)}
      >
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 ${
          isConsultation ? 'border-l-4 border-l-green-400 pl-4' : ''
        }`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {isConsultation ? (
                  <VideoCameraIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <UserIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {isConsultation ? consultation!.clientInfo.name : booking!.clientName}
                </p>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {isConsultation 
                      ? formatDate(consultation!.submittedAt)
                      : formatDate(booking!.createdAt)
                    }
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {isConsultation ? 'Virtual Consultation' : booking!.service}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {isConsultation ? (
                request.status === 'pending' ? 'Pending Review' :
                request.status === 'reviewed' ? 'Reviewed' : 'Unknown'
              ) : (
                request.status === 'pending' ? 'Pending' : 
                request.status === 'contacted' ? 'Contacted' :
                request.status === 'booked' ? 'Booked' : 'Not Booked'
              )}
            </span>
            
            {/* Quick status change buttons - different for consultation vs booking */}
            <div className="flex items-center space-x-1">
              {isConsultation ? (
                // Consultation action buttons
                request.status === 'pending' && (
                  <button
                    onClick={(e) => updateConsultationStatus(request.id, 'reviewed', e)}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    title="Mark as reviewed"
                  >
                    <CheckIcon className="h-3 w-3" />
                  </button>
                )
              ) : (
                // Booking action buttons (existing logic)
                <>
                  {request.status !== 'booked' && (
                    <button
                      onClick={(e) => updateRequestStatus(request.id, 'booked', e)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                      title="Mark as booked"
                    >
                      <CheckIcon className="h-3 w-3" />
                    </button>
                  )}
                  {request.status !== 'not-booked' && (
                    <button
                      onClick={(e) => updateRequestStatus(request.id, 'not-booked', e)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                      title="Mark as not booked"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  )}
                  {request.status !== 'contacted' && (
                    <button
                      onClick={(e) => updateRequestStatus(request.id, 'contacted', e)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      title="Mark as contacted"
                    >
                      <PhoneIcon className="h-3 w-3" />
                    </button>
                  )}
                  {request.status !== 'pending' && (
                    <button
                      onClick={(e) => updateRequestStatus(request.id, 'pending', e)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                      title="Mark as pending"
                    >
                      <ClockIcon className="h-3 w-3" />
                    </button>
                  )}
                </>
              )}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(request.id)
              }}
              className="inline-flex items-center p-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {expandedRequest === request.id ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expandedRequest === request.id && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Client Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserIcon className="h-4 w-4 mr-2" />
                    {isConsultation ? consultation!.clientInfo.name : booking!.clientName}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    {isConsultation ? consultation!.clientInfo.email : booking!.clientEmail}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    <ClickablePhone phone={
                      isConsultation ? consultation!.clientInfo.phone : booking!.clientPhone
                    } />
                  </div>
                </div>
              </div>
              
              <div>
                {isConsultation ? (
                  <>
                    <h4 className="font-medium text-gray-900 mb-2">Consultation Details</h4>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Service:</span>
                        <span className="ml-2 text-gray-600">Virtual Consultation</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Submitted:</span>
                        <span className="ml-2 text-gray-600">{formatDate(consultation!.submittedAt)}</span>
                      </div>
                      {consultation!.files && consultation!.files.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Files:</span>
                          <span className="ml-2 text-gray-600">{consultation!.files.length} file(s) attached</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Service:</span>
                        <span className="ml-2 text-gray-600">{booking!.service}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Service Provider Preference:</span>
                        <span className="ml-2 text-gray-600">{booking!.stylistPreference}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Preferred Date/Time:</span>
                        <span className="ml-2 text-gray-600">{booking!.dateTimePreference}</span>
                      </div>
                      {booking!.waitlistOptIn && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Waitlist:</span>
                          <span className="ml-2 text-gray-600">Yes, include me on waitlist</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {((isConsultation && Object.values(consultation!.formData).some(value => 
              typeof value === 'string' && value.trim().length > 0
            )) || (!isConsultation && booking!.notes)) && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  {isConsultation ? 'Consultation Form Data' : 'Additional Notes'}
                </h4>
                {isConsultation ? (
                  <div className="bg-gray-50 p-3 rounded-md space-y-2">
                    {Object.entries(consultation!.formData).map(([key, value]) => {
                      if (typeof value === 'string' && value.trim().length > 0) {
                        return (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-gray-700 capitalize">
                              {key.replace(/-/g, ' ')}:
                            </span>
                            <span className="ml-2 text-gray-600">{value}</span>
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {booking!.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading request history...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex-auto">
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard/requests"
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Requests
              </Link>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900">Request History</h1>
            <p className="mt-2 text-sm text-gray-700">
              Complete history of all client requests (bookings & consultations)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
              />
            </div>

            {/* Request Type Filter */}
            <div className="relative">
              <select
                value={requestTypeFilter}
                onChange={(e) => {
                  setRequestTypeFilter(e.target.value as 'all' | 'bookings' | 'consultations')
                  setStatusFilter('all') // Reset status filter when request type changes
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
              >
                <option value="all">All Request Types</option>
                <option value="bookings">Bookings Only</option>
                <option value="consultations">Consultations Only</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'contacted' | 'reviewed' | 'booked' | 'not-booked')}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                {(requestTypeFilter === 'all' || requestTypeFilter === 'bookings') && (
                  <>
                    <option value="contacted">Contacted</option>
                    <option value="booked">Booked</option>
                    <option value="not-booked">Not Booked</option>
                  </>
                )}
                {(requestTypeFilter === 'all' || requestTypeFilter === 'consultations') && (
                  <option value="reviewed">Reviewed</option>
                )}
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} requests
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-6">
          {currentRequests.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200">
                {currentRequests.map(renderRequestCard)}
              </ul>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No requests have been submitted yet.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
