'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { teamService } from '@/lib/firebase/services'
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
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { BookingRequest } from '@/types/firebase'
import ClickablePhone from '@/components/ui/ClickablePhone'

// Type alias to handle Firebase timestamp format
type BookingRequestWithFirebaseTimestamps = Omit<BookingRequest, 'createdAt' | 'updatedAt'> & {
  createdAt: Date | { toDate: () => Date }
  updatedAt: Date | { toDate: () => Date }
}

export default function RequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<BookingRequestWithFirebaseTimestamps[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)
  const [showRecentlyCompleted, setShowRecentlyCompleted] = useState(false)

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return

      try {
        // Get the user's salon ID - check if they're a team member first
        let salonId = user.uid // Default to user.uid for salon owners
        let userTeamMember = null
        
        try {
          userTeamMember = await teamService.getTeamMemberByUserId(user.uid)
          
          if (userTeamMember) {
            salonId = userTeamMember.salonId
          }
        } catch (teamMemberError) {
          console.error('Error fetching team member data:', teamMemberError)
          salonId = user.uid
        }
        
        const requestsQuery = query(
          collection(db, 'bookingRequests'),
          where('salonId', '==', salonId)
        )
        const snapshot = await getDocs(requestsQuery)
        
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BookingRequest[]
        
        // Sort in memory instead
        const sortedRequests = requestsData.sort((a, b) => {
          // Define status priority: pending > provider-requested > contacted > others
          const getStatusPriority = (status: string) => {
            switch (status) {
              case 'pending': return 4;
              case 'provider-requested': return 3;
              case 'contacted': return 2;
              default: return 1;
            }
          };
          
          const priorityA = getStatusPriority(a.status);
          const priorityB = getStatusPriority(b.status);
          
          if (priorityA !== priorityB) {
            return priorityB - priorityA; // Higher priority first
          }
          
          // If both have the same status priority, sort by date (most recent first)
          const dateA = typeof a.createdAt === 'object' && 'toDate' in a.createdAt 
            ? (a.createdAt as { toDate: () => Date }).toDate() 
            : new Date(a.createdAt);
          const dateB = typeof b.createdAt === 'object' && 'toDate' in b.createdAt 
            ? (b.createdAt as { toDate: () => Date }).toDate() 
            : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        setRequests(sortedRequests)
      } catch (error) {
        console.error('Error fetching requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [user])

  const updateRequestStatus = async (requestId: string, status: 'booked' | 'not-booked' | 'pending' | 'contacted' | 'provider-requested', e?: React.MouseEvent) => {
    e?.stopPropagation() // Prevent card expansion when clicking buttons
    
    try {
      await updateDoc(doc(db, 'bookingRequests', requestId), {
        status,
        updatedAt: new Date()
      })
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { 
          ...req, 
          status, 
          updatedAt: new Date()
        } : req
      ))
    } catch (error) {
      console.error('Error updating request status:', error)
    }
  }

  const toggleExpanded = (requestId: string) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId)
  }

  const formatDate = (timestamp: Date | { toDate: () => Date }) => {
    if (!timestamp) return 'Unknown date'
    
    const date = typeof timestamp === 'object' && 'toDate' in timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp)
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
      case 'provider-requested':
        return 'bg-purple-100 text-purple-800'
      case 'booked':
        return 'bg-green-100 text-green-800'
      case 'not-booked':
        return 'bg-red-100 text-red-800'
      case 'contacted':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isRecentlyCompleted = (request: BookingRequestWithFirebaseTimestamps) => {
    if (request.status === 'pending') return false
    
    // Check if completed within last 48 hours
    const updatedDate = typeof request.updatedAt === 'object' && 'toDate' in request.updatedAt 
      ? (request.updatedAt as { toDate: () => Date }).toDate() 
      : new Date(request.updatedAt);
    
    const hoursAgo = (new Date().getTime() - updatedDate.getTime()) / (1000 * 60 * 60)
    return hoursAgo <= 48
  }

  // Separate requests into categories
  const pendingRequests = requests.filter(req => req.status === 'pending')
  const providerRequests = requests.filter(req => req.status === 'provider-requested')
  const contactedRequests = requests.filter(req => req.status === 'contacted')
  const recentlyCompletedRequests = requests.filter(req => isRecentlyCompleted(req))
  
  const renderRequestCard = (request: BookingRequestWithFirebaseTimestamps) => (
    <li key={request.id}>
      <div 
        className={`px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors ${
          request.submittedByProvider ? 'border-l-4 border-l-purple-400' : ''
        }`}
        onClick={() => toggleExpanded(request.id)}
      >
        {/* Mobile-optimized main card content */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Left side - Essential info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {request.clientName}
                </p>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatDate(request.createdAt)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {request.service}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Status and actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {request.status === 'pending' ? 'Pending' : 
               request.status === 'provider-requested' ? 'Provider Requested' : 
               request.status === 'booked' ? 'Booked' : 
               request.status === 'contacted' ? 'Contacted' : 'Not Booked'}
            </span>
            
            {/* Action buttons - consolidated logic */}
            {(request.status === 'pending' || request.status === 'provider-requested') && (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={(e) => updateRequestStatus(request.id, 'contacted', e)}
                  className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PhoneIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Mark Contacted</span>
                  <span className="sm:hidden">Contacted</span>
                </button>
                <button
                  onClick={(e) => updateRequestStatus(request.id, 'booked', e)}
                  className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Appointment Made</span>
                  <span className="sm:hidden">Booked</span>
                </button>
                <button
                  onClick={(e) => updateRequestStatus(request.id, 'not-booked', e)}
                  className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Not Booked</span>
                  <span className="sm:hidden">Not Booked</span>
                </button>
              </div>
            )}

            {/* Action buttons for contacted requests */}
            {request.status === 'contacted' && (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={(e) => updateRequestStatus(request.id, 'booked', e)}
                  className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Appointment Made</span>
                  <span className="sm:hidden">Booked</span>
                </button>
                <button
                  onClick={(e) => updateRequestStatus(request.id, 'not-booked', e)}
                  className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Not Booked</span>
                  <span className="sm:hidden">Not Booked</span>
                </button>
              </div>
            )}

            {/* Status change buttons for completed requests (booked/not-booked) */}
            {(request.status === 'booked' || request.status === 'not-booked') && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => updateRequestStatus(request.id, request.status === 'booked' ? 'not-booked' : 'booked', e)}
                  className={`inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md ${
                    request.status === 'booked' 
                      ? 'text-red-700 bg-red-100 hover:bg-red-200' 
                      : 'text-green-700 bg-green-100 hover:bg-green-200'
                  }`}
                >
                  {request.status === 'booked' ? (
                    <>
                      <XMarkIcon className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Mark Not Booked</span>
                      <span className="sm:hidden">Not Booked</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Mark Booked</span>
                      <span className="sm:hidden">Booked</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(request.id)
              }}
              className="inline-flex items-center p-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
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
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    {request.clientEmail}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    <ClickablePhone phone={request.clientPhone} />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Service:</span>
                    <span className="ml-2 text-gray-600">{request.service}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Service Provider Preference:</span>
                    <span className="ml-2 text-gray-600">{request.stylistPreference}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Preferred Date/Time:</span>
                    <span className="ml-2 text-gray-600">{request.dateTimePreference}</span>
                  </div>
                  {request.waitlistOptIn && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Waitlist:</span>
                      <span className="ml-2 text-gray-600">Yes, include me on waitlist</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {request.notes && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Additional Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {request.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  )

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

        <div className="mt-8 space-y-8">
          {/* Pending Requests Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Pending Requests</h2>
              {pendingRequests.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {pendingRequests.length} pending
                </span>
              )}
            </div>
            
            {pendingRequests.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {pendingRequests.map(renderRequestCard)}
                </ul>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  New booking requests will appear here when submitted.
                </p>
              </div>
            )}
          </div>

          {/* Provider Requests Section */}
          {providerRequests.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Provider Requests</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {providerRequests.length} provider requests
                </span>
              </div>
              
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {providerRequests.map(renderRequestCard)}
                </ul>
              </div>
            </div>
          )}

          {/* Contacted Requests Section */}
          {contactedRequests.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Contacted Clients</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {contactedRequests.length} contacted
                </span>
              </div>
              
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {contactedRequests.map(renderRequestCard)}
                </ul>
              </div>
            </div>
          )}

          {/* Recently Completed Section */}
          {recentlyCompletedRequests.length > 0 && (
            <div>
              <button
                onClick={() => setShowRecentlyCompleted(!showRecentlyCompleted)}
                className="flex items-center justify-between w-full mb-4 p-3 text-left bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center">
                  <h2 className="text-lg font-medium text-gray-900">Recently Completed</h2>
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                    {recentlyCompletedRequests.length} recent
                  </span>
                </div>
                {showRecentlyCompleted ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
              
              {showRecentlyCompleted && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                      Requests completed in the last 48 hours. You can still change their status if needed.
                    </p>
                  </div>
                  <ul className="divide-y divide-gray-200">
                    {recentlyCompletedRequests.map(renderRequestCard)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* View All History Link */}
          <div className="text-center">
            <Link
              href="/dashboard/requests/history"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              View All Booking History
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 