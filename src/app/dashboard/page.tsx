"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  ClipboardDocumentIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { bookingRequestService } from '@/lib/firebase/services'
import { BookingRequest } from '@/types/firebase'
import { SessionTrackingService } from '@/lib/sessionTracking'

interface DashboardStats {
  appointmentsCreated: number
  requestedNotFulfilled: number
  totalClients: number
  averageResponseTime: string
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
  const [copied, setCopied] = useState(false)
  const [salonData, setSalonData] = useState<Salon | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    appointmentsCreated: 0,
    requestedNotFulfilled: 0,
    totalClients: 0,
    averageResponseTime: '0 hours',
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
        // Fetch salon data using user UID as document ID
        const salonDocRef = doc(db, 'salons', user.uid)
        console.log('Fetching salon document with ID:', user.uid)
        const salonDoc = await getDoc(salonDocRef)
        if (salonDoc.exists()) {
          const salon = salonDoc.data() as Salon
          console.log('Salon data loaded:', salon)
          console.log('Salon name:', salon.name)
          console.log('Salon bookingUrl:', salon.bookingUrl)
          setSalonData(salon)
        } else {
          console.log('No salon document found for user:', user.uid)
          setSalonData(null)
        }

        // Fetch booking requests for this salon
        const bookingRequests = await bookingRequestService.getBookingRequests(user.uid)
        
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
          averageResponseTime: '2.3 hours',
          totalUniqueSessions: sessionData.totalSessions,
          formCompletionRate: sessionData.formCompletionRate
        })

        // Create recent activity from booking requests
        const activity: RecentActivity[] = bookingRequests.slice(0, 4).map((req: BookingRequest) => ({
          id: req.id,
          type: req.status === 'booked' ? 'appointment_booked' : 
                req.status === 'not-booked' ? 'appointment_not_booked' : 'booking_request',
          message: `Booking request from ${req.clientName}`,
          timestamp: req.createdAt ? new Date(req.createdAt) : new Date(),
          status: req.status === 'pending' ? 'pending' : 'completed'
        }))

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
    if (typeof timestamp === 'string') {
      date = new Date(timestamp)
    } else if (typeof timestamp === 'object' && 'toDate' in timestamp) {
      date = timestamp.toDate()
    } else {
      date = timestamp
    }
    
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const copyBookingUrl = () => {
    const bookingUrl = salonData?.bookingUrl || `https://last-minute-app.vercel.app/booking/${salonData?.slug}`
    if (bookingUrl) {
      navigator.clipboard.writeText(bookingUrl).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  const createSalonDocument = async () => {
    if (!user) return
    
    try {
      const salonData = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'My Salon',
        slug: (user.displayName || user.email?.split('@')[0] || 'my-salon').toLowerCase().replace(/\s+/g, '-'),
        bookingUrl: `https://last-minute-app.vercel.app/booking/${(user.displayName || user.email?.split('@')[0] || 'my-salon').toLowerCase().replace(/\s+/g, '-')}`,
        ownerName: user.displayName || 'Salon Owner',
        ownerEmail: user.email || '',
        businessType: 'salon',
        settings: {
          notifications: {
            email: true,
            sms: false
          },
          booking: {
            requireConsultation: false,
            allowWaitlist: true
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await setDoc(doc(db, 'salons', user.uid), salonData)
      console.log('Salon document created successfully')
      
      // Refresh the page to load the new data
      window.location.reload()
    } catch (error) {
      console.error('Error creating salon document:', error)
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

        {/* Booking URL Section */}
        {(() => {
          console.log('Rendering booking URL section check:')
          console.log('salonData:', salonData)
          console.log('salonData?.bookingUrl:', salonData?.bookingUrl)
          console.log('salonData?.name:', salonData?.name)
          console.log('Should show booking URL:', (salonData?.bookingUrl || salonData?.name))
          
          if (!salonData) {
            return (
              <div className="mt-8 rounded-lg bg-yellow-50 p-6 shadow-sm border border-yellow-200">
                <h2 className="text-lg font-semibold text-yellow-900 mb-2">Setup Required</h2>
                <p className="text-sm text-yellow-700 mb-4">
                  Your salon profile hasn&apos;t been set up yet. Click the button below to create your salon profile and get your booking URL.
                </p>
                <button
                  onClick={createSalonDocument}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Create Salon Profile
                </button>
              </div>
            )
          }
          
          return (salonData?.bookingUrl || salonData?.name) && (
            <div className="mt-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Booking URL</h2>
              <p className="text-sm text-gray-600 mb-4">
                Share this link with your clients so they can request appointments
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={salonData?.bookingUrl || `https://last-minute-app.vercel.app/booking/${salonData?.slug}`}
                  className="flex-1 rounded-l-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none"
                />
                <button
                  onClick={copyBookingUrl}
                  className="inline-flex items-center justify-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors"
                  aria-label="Copy booking URL"
                >
                  <ClipboardDocumentIcon className="h-5 w-5" />
                </button>
              </div>
              {copied && (
                <p className="mt-2 text-sm text-green-600">✓ Copied to clipboard!</p>
              )}
            </div>
          )
        })()}

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
                  <ClockIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">
                      Avg Response Time
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardStats.averageResponseTime}
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