"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  UserGroupIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { bookingRequestService, teamService } from '@/lib/firebase/services'
import { BookingRequest } from '@/types/firebase'
import { SessionTrackingService } from '@/lib/sessionTracking'


interface DashboardStats {
  appointmentsCreated: number
  requestedNotFulfilled: number
  totalClients: number
  totalUniqueSessions: number
  formCompletionRate: number
}

interface RecentActivity {
  id: string
  type: string
  message: string
  timestamp: Date
  status: 'pending' | 'completed'
}

interface Salon {
  id: string
  name: string
  slug: string
  bookingUrl: string
  ownerName: string
  ownerEmail: string
  businessType: string
  settings: {
    notifications: {
      email: boolean
      sms: boolean
    }
    booking: {
      requireConsultation: boolean
      allowWaitlist: boolean
    }
  }
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    appointmentsCreated: 0,
    requestedNotFulfilled: 0,
    totalClients: 0,
    totalUniqueSessions: 0,
    formCompletionRate: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        console.log('No user found')
        return
      }

      console.log('Fetching dashboard data for user:', user.uid)
      setLoading(true)

      try {
        // First, check if user is a team member
        const userTeamMember = await teamService.getTeamMemberByUserId(user.uid)
        let salonId = user.uid // Default to user.uid for salon admins
        
        if (userTeamMember) {
          // User is a team member, use their salonId
          salonId = userTeamMember.salonId
          console.log('User is a team member, using salonId:', salonId)
        } else {
          console.log('User is a salon admin, using user.uid as salonId')
        }

        // Fetch salon data - first try by user ID, then by ownerEmail
        let salon = null
        
        // Try to get salon by user ID first
        const salonDocRef = doc(db, 'salons', salonId)
        console.log('Fetching salon document with ID:', salonId)
        const salonDoc = await getDoc(salonDocRef)
        
        if (salonDoc.exists()) {
          salon = salonDoc.data() as Salon
          console.log('Salon data loaded by user ID:', salon.name)
        } else {
          console.log('No salon document found for user ID, trying to find by ownerEmail')
          
          // If not found by user ID, try to find by ownerEmail
          const salonsRef = collection(db, 'salons')
          const q = query(salonsRef, where('ownerEmail', '==', user.email))
          const querySnapshot = await getDocs(q)
          
          if (!querySnapshot.empty) {
            const salonDoc = querySnapshot.docs[0]
            salon = { id: salonDoc.id, ...salonDoc.data() } as Salon
            console.log('Salon data loaded by ownerEmail:', salon.name)
            console.log('Found salon with document ID:', salonDoc.id)
          } else {
            console.log('No salon document found for ownerEmail:', user.email)
          }
        }
        
        if (salon) {
          console.log('Salon name:', salon.name)
          console.log('Salon bookingUrl:', salon.bookingUrl)
        }

        // Fetch booking requests for this salon
        const bookingRequests = await bookingRequestService.getBookingRequests(salonId)
        
        // Calculate stats
        const bookedRequests = bookingRequests.filter((req: BookingRequest) => req.status === 'booked').length
        const notBookedRequests = bookingRequests.filter((req: BookingRequest) => req.status === 'not-booked').length
        const pendingRequests = bookingRequests.filter((req: BookingRequest) => req.status === 'pending').length
        
        // Get unique clients
        const uniqueClients = new Set(bookingRequests.map((req: BookingRequest) => req.clientEmail)).size
        
        const sessionTracking = SessionTrackingService.getInstance()
        const sessionData = await sessionTracking.getAnalyticsData(user.uid)
        
        setDashboardStats({
          appointmentsCreated: bookedRequests,
          requestedNotFulfilled: notBookedRequests + pendingRequests,
          totalClients: uniqueClients,
          totalUniqueSessions: sessionData.totalSessions,
          formCompletionRate: sessionData.formCompletionRate
        })

        // Create recent activity from booking requests
        const activity: RecentActivity[] = bookingRequests.slice(0, 4).map((req: BookingRequest) => {
          // Properly handle Firestore timestamp objects
          let timestamp: Date
          if (req.createdAt && typeof req.createdAt === 'object' && 'toDate' in req.createdAt) {
            timestamp = (req.createdAt as { toDate: () => Date }).toDate()
          } else if (req.createdAt) {
            timestamp = new Date(req.createdAt)
          } else {
            timestamp = new Date()
          }

          return {
            id: req.id,
            type: req.status === 'booked' ? 'appointment_booked' : 
                  req.status === 'not-booked' ? 'appointment_not_booked' : 'booking_request',
            message: `Booking request from ${req.clientName}`,
            timestamp,
            status: req.status === 'pending' ? 'pending' : 'completed'
          }
        })

        setRecentActivity(activity)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  const formatTimeAgo = (timestamp: Date | { toDate: () => Date } | string) => {
    if (!timestamp) return 'Unknown time'
    
    let date: Date
    try {
      if (typeof timestamp === 'string') {
        date = new Date(timestamp)
      } else if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
        date = timestamp.toDate()
      } else if (timestamp instanceof Date) {
        date = timestamp
      } else {
        console.warn('Unknown timestamp format:', timestamp)
        return 'Unknown time'
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', timestamp)
        return 'Unknown time'
      }
      
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      
      if (diffInMinutes < 0) return 'Just now' // Handle future dates
      if (diffInMinutes < 1) return 'Just now'
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
      return `${Math.floor(diffInMinutes / 1440)} days ago`
    } catch (error) {
      console.error('Error formatting time ago:', error, timestamp)
      return 'Unknown time'
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-700 mb-4">
              Overview of your salon&apos;s booking activity and performance
            </p>
          </div>
        </div>



        {/* Stats Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">
                      Appointments Created
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardStats.appointmentsCreated}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XMarkIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">
                      Requested but not Fulfilled
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardStats.requestedNotFulfilled}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">
                      Total Clients
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardStats.totalClients}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">Unique Sessions</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardStats.totalUniqueSessions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2M7 9l5-5 5 5M12 4v12" /></svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">Form Completion Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardStats.formCompletionRate}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {recentActivity.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <li key={activity.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {activity.type === 'booking_request' && (
                              <CalendarIcon className="h-5 w-5 text-blue-500" />
                            )}
                            {activity.type === 'appointment_booked' && (
                              <CalendarIcon className="h-5 w-5 text-green-500" />
                            )}
                            {activity.type === 'appointment_not_booked' && (
                              <XMarkIcon className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.message}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            activity.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by sharing your booking URL with clients.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 