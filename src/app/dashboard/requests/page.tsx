'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useSalonContext } from '@/lib/hooks/useSalonContext'
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
  DocumentTextIcon,
  VideoCameraIcon,
  PhotoIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { BookingRequest, ConsultationSubmission } from '@/types/firebase'
import ClickablePhone from '@/components/ui/ClickablePhone'

// Type alias to handle Firebase timestamp format
type BookingRequestWithFirebaseTimestamps = Omit<BookingRequest, 'createdAt' | 'updatedAt'> & {
  createdAt: Date | { toDate: () => Date }
  updatedAt: Date | { toDate: () => Date }
}

// Unified request type that includes both booking and consultation requests
type UnifiedRequest = (BookingRequestWithFirebaseTimestamps | ConsultationSubmission) & {
  requestType: 'booking' | 'consultation'
}

// Type for booking data from Firestore
interface BookingData {
  id: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceName?: string;
  stylistPreference?: string;
  dateTimePreference?: string;
  notes?: string;
  status?: string;
  salonId?: string;
  createdAt?: Date | { toDate: () => Date };
  updatedAt?: Date | { toDate: () => Date };
  date?: Date | { toDate: () => Date };
}

export default function RequestsPage() {
  const { user } = useAuth()
  const { salonId: contextSalonId, isImpersonating, isPlatformAdmin, selectedSalonId } = useSalonContext()
  const [requests, setRequests] = useState<UnifiedRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)
  const [showRecentlyCompleted, setShowRecentlyCompleted] = useState(false)

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return

      try {
        // Use salon context (either selected salon for SuperAdmin or user's own salon)
        const salonId = contextSalonId || user.uid
        
        // Get the user's role - check if they're a team member first
        let userTeamMember = null
        let userRole = 'admin' // Default to admin
        
        try {
          userTeamMember = await teamService.getTeamMemberByUserId(user.uid)
          
          if (userTeamMember) {
            // Determine user role
            if (userTeamMember.role === 'owner' || userTeamMember.role === 'admin' || userTeamMember.role === 'front_desk') {
              userRole = 'admin'
            } else {
              userRole = 'service_provider'
            }
          }
        } catch (teamMemberError) {
          console.error('Error fetching team member data:', teamMemberError)
        }
        
        if (userRole === 'service_provider') {
          // For service providers, show their own bookings
          const providerDoc = await getDocs(
            query(
              collection(db, 'providers'),
              where('teamMemberId', '==', user.uid)
            )
          )

          if (providerDoc.empty) {
            setRequests([])
            setLoading(false)
            return
          }

          const provider = providerDoc.docs[0].data()
          const serviceIds = provider.services || []

          if (serviceIds.length === 0) {
            setRequests([])
            setLoading(false)
            return
          }

          // Get bookings for the provider's services
          const bookingsQuery = query(
            collection(db, 'bookings'),
            where('serviceId', 'in', serviceIds),
            orderBy('createdAt', 'desc')
          )

          const bookingsSnapshot = await getDocs(bookingsQuery)
          const bookingsData = bookingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as BookingData[]

          // Transform bookings to match UnifiedRequest format for consistency
          const transformedBookings: UnifiedRequest[] = bookingsData.map(booking => ({
            id: booking.id,
            clientName: booking.clientName || 'Unknown',
            clientEmail: booking.clientEmail || '',
            clientPhone: booking.clientPhone || '',
            service: booking.serviceName || 'Unknown Service',
            stylistPreference: booking.stylistPreference || 'Any service provider',
            dateTimePreference: booking.dateTimePreference || '',
            notes: booking.notes || '',
            waitlistOptIn: false,
            status: (booking.status as 'pending' | 'contacted' | 'booked' | 'not-booked' | 'provider-requested') || 'pending',
            salonId: booking.salonId || salonId,
            submittedByProvider: false,
            createdAt: booking.createdAt || booking.date || new Date(),
            updatedAt: booking.updatedAt || booking.date || new Date(),
            requestType: 'booking' as const
          }))

          setRequests(transformedBookings)
        } else {
          // For admins, show all booking requests AND consultation submissions
          // Fetch booking requests and consultation submissions separately for better error handling
          let bookingRequests: (BookingRequest & { requestType: 'booking' })[] = []
          let consultationSubmissions: (ConsultationSubmission & { requestType: 'consultation' })[] = []
          
          try {
            console.log('🔍 Fetching booking requests for salon:', salonId)
            const bookingSnapshot = await getDocs(query(
              collection(db, 'bookingRequests'),
              where('salonId', '==', salonId)
            ))
            bookingRequests = bookingSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              requestType: 'booking' as const
            })) as (BookingRequest & { requestType: 'booking' })[]
            console.log('✅ Booking requests fetched:', bookingRequests.length)
          } catch (bookingError) {
            console.error('❌ Error fetching booking requests:', bookingError)
            throw new Error(`Failed to fetch booking requests: ${bookingError}`)
          }
          
          try {
            console.log('🔍 Fetching consultation submissions for salon:', salonId)
            // For SuperAdmin context switching, temporarily skip consultations to avoid permission issues
            if (isPlatformAdmin && selectedSalonId) {
              console.log('⚠️ Skipping consultations for SuperAdmin context switching (permission issue)')
              consultationSubmissions = []
            } else {
              // Query consultations directly instead of using the service
              const consultationQuery = query(
                collection(db, 'consultations'),
                where('salonId', '==', salonId)
              )
              const consultationSnapshot = await getDocs(consultationQuery)
              const consultations = consultationSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                requestType: 'consultation' as const,
                // Convert Firestore Timestamps to Date objects
                submittedAt: doc.data().submittedAt?.toDate() || new Date(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
              })) as (ConsultationSubmission & { requestType: 'consultation' })[]
              
              consultationSubmissions = consultations
              console.log('✅ Consultation submissions fetched:', consultationSubmissions.length)
            }
          } catch (consultationError) {
            console.error('❌ Error fetching consultation submissions:', consultationError)
            throw new Error(`Failed to fetch consultation submissions: ${consultationError}`)
          }
          
          // Combine both types of requests
          const allRequests: UnifiedRequest[] = [
            ...bookingRequests,
            ...consultationSubmissions
          ]
          
          // Sort all requests
          const sortedRequests = allRequests.sort((a, b) => {
            // Define status priority: pending > provider-requested > contacted > others
            const getStatusPriority = (status: string) => {
              switch (status) {
                case 'pending': return 4;
                case 'provider-requested': return 3;
                case 'contacted': return 2;
                case 'reviewed': return 2; // Same as contacted for consultations
                default: return 1;
              }
            };
            
            const statusA = a.requestType === 'booking' ? (a as BookingRequest).status : (a as ConsultationSubmission).status;
            const statusB = b.requestType === 'booking' ? (b as BookingRequest).status : (b as ConsultationSubmission).status;
            
            const priorityA = getStatusPriority(statusA);
            const priorityB = getStatusPriority(statusB);
            
            if (priorityA !== priorityB) {
              return priorityB - priorityA; // Higher priority first
            }
            
            // If both have the same status priority, sort by date (most recent first)
            const getDate = (request: UnifiedRequest) => {
              if (request.requestType === 'booking') {
                const booking = request as BookingRequest;
                return typeof booking.createdAt === 'object' && 'toDate' in booking.createdAt 
                  ? (booking.createdAt as { toDate: () => Date }).toDate() 
                  : new Date(booking.createdAt);
              } else {
                const consultation = request as ConsultationSubmission;
                return consultation.submittedAt instanceof Date ? consultation.submittedAt : new Date(consultation.submittedAt);
              }
            };
            
            const dateA = getDate(a);
            const dateB = getDate(b);
            return dateB.getTime() - dateA.getTime();
          });
          
          setRequests(sortedRequests)
        }
      } catch (error) {
        console.error('Error fetching requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [user, contextSalonId])

  const updateRequestStatus = async (requestId: string, status: 'booked' | 'not-booked' | 'pending' | 'contacted' | 'provider-requested', e?: React.MouseEvent) => {
    e?.stopPropagation() // Prevent card expansion when clicking buttons
    
    try {
      await updateDoc(doc(db, 'bookingRequests', requestId), {
        status,
        updatedAt: new Date()
      })
      
      // Update local state
      setRequests(prev => prev.map(req => {
        if (req.id === requestId && req.requestType === 'booking') {
          return { 
            ...req, 
            status, 
            updatedAt: new Date()
          } as UnifiedRequest
        }
        return req
      }))
    } catch (error) {
      console.error('Error updating request status:', error)
    }
  }

  const updateConsultationStatus = async (requestId: string, status: 'pending' | 'reviewed', e?: React.MouseEvent) => {
    e?.stopPropagation() // Prevent card expansion when clicking buttons
    
    try {
      await consultationService.updateConsultationStatus(requestId, status)
      
      // Update local state
      setRequests(prev => prev.map(req => {
        if (req.id === requestId && req.requestType === 'consultation') {
          return { 
            ...req, 
            status, 
            updatedAt: new Date()
          } as UnifiedRequest
        }
        return req
      }))
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
      case 'provider-requested':
        return 'bg-purple-100 text-purple-800'
      case 'booked':
        return 'bg-green-100 text-green-800'
      case 'not-booked':
        return 'bg-red-100 text-red-800'
      case 'contacted':
        return 'bg-blue-100 text-blue-800'
      case 'reviewed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isRecentlyCompleted = (request: UnifiedRequest) => {
    if (request.status === 'pending') return false
    
    // Check if completed within last 48 hours
    const getUpdatedDate = (req: UnifiedRequest) => {
      if (req.requestType === 'consultation') {
        const consultation = req as ConsultationSubmission
        return consultation.updatedAt instanceof Date ? consultation.updatedAt : new Date(consultation.updatedAt)
      } else {
        const booking = req as BookingRequestWithFirebaseTimestamps
        return typeof booking.updatedAt === 'object' && 'toDate' in booking.updatedAt 
          ? (booking.updatedAt as { toDate: () => Date }).toDate() 
          : new Date(booking.updatedAt)
      }
    }
    
    const updatedDate = getUpdatedDate(request)
    const hoursAgo = (new Date().getTime() - updatedDate.getTime()) / (1000 * 60 * 60)
    return hoursAgo <= 48
  }

  // Separate requests into categories
  const pendingRequests = requests.filter(req => req.status === 'pending')
  const providerRequests = requests.filter(req => req.status === 'provider-requested')
  const contactedRequests = requests.filter(req => 
    req.status === 'contacted'
  )
  const recentlyCompletedRequests = requests.filter(req => isRecentlyCompleted(req))
  
  const renderRequestCard = (request: UnifiedRequest) => {
    const isConsultation = request.requestType === 'consultation'
    const consultation = isConsultation ? request as ConsultationSubmission : null
    const booking = !isConsultation ? request as BookingRequestWithFirebaseTimestamps : null
    
    return (
    <li key={request.id}>
      <div 
        className={`px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors ${
          isConsultation ? 'border-l-4 border-l-green-400' : 
          booking?.submittedByProvider ? 'border-l-4 border-l-purple-400' : ''
        }`}
        onClick={() => toggleExpanded(request.id)}
      >
        {/* Mobile-optimized main card content */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Left side - Essential info */}
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
                    {isConsultation ? (
                      <>
                        <VideoCameraIcon className="h-4 w-4 mr-1" />
                        Virtual Consultation
                      </>
                    ) : (
                      <>
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {booking!.service}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Status and actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {isConsultation ? (
                request.status === 'pending' ? 'Pending Review' :
                request.status === 'reviewed' ? 'Reviewed' : 'Unknown'
              ) : (
                request.status === 'pending' ? 'Pending' : 
                request.status === 'provider-requested' ? 'Provider Requested' : 
                request.status === 'booked' ? 'Booked' : 
                request.status === 'contacted' ? 'Contacted' : 'Not Booked'
              )}
            </span>
            
            {/* Action buttons - different for consultation vs booking */}
            {isConsultation ? (
              // Consultation action buttons - only Mark Reviewed needed
              request.status === 'pending' && (
                <button
                  onClick={(e) => updateConsultationStatus(request.id, 'reviewed', e)}
                  className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Mark Reviewed</span>
                  <span className="sm:hidden">Reviewed</span>
                </button>
              )
            ) : (
              // Booking action buttons (existing logic)
              <>
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
              </>
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
                    {isConsultation ? consultation!.clientInfo.email : booking!.clientEmail}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    <ClickablePhone phone={isConsultation ? consultation!.clientInfo.phone : booking!.clientPhone} />
                  </div>
                </div>
              </div>
              
              {isConsultation ? (
                // Consultation-specific details
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Consultation Details</h4>
                  <div className="space-y-2">
                    {consultation!.formData && Object.entries(consultation!.formData).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium text-gray-700 capitalize">
                          {key.replace(/-/g, ' ')}:
                        </span>
                        <span className="ml-2 text-gray-600">{value}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Show uploaded files */}
                  {consultation!.files && consultation!.files.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-2">Uploaded Files</h5>
                      <div className="space-y-2">
                        {consultation!.files.map((file, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <PhotoIcon className="h-4 w-4 text-gray-400" />
                            <a 
                              href={file.url.startsWith('placeholder:') ? '#' : file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-sm ${file.url.startsWith('placeholder:') ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                            >
                              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </a>
                            {file.url.startsWith('placeholder:') && (
                              <span className="text-xs text-red-500">(Upload pending)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Booking-specific details
                <div>
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
                </div>
              )}
            </div>
            
            {/* Additional notes - handle both types */}
            {((isConsultation && consultation!.formData['additional-notes']) || 
              (!isConsultation && booking!.notes)) && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Additional Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {isConsultation 
                    ? consultation!.formData['additional-notes'] 
                    : booking!.notes
                  }
                </p>
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
            {isImpersonating && (
              <div className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <span>👁️ Viewing as SuperAdmin</span>
              </div>
            )}
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
              View All Request History
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 