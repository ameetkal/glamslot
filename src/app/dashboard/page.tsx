"use client"

import { CalendarIcon, UserGroupIcon, ClockIcon, XMarkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface DashboardStats {
  appointmentsCreated: number
  requestedNotFulfilled: number
  totalClients: number
  averageResponseTime: string
}

interface RecentActivity {
  id: string
  type: 'booking_request' | 'appointment_booked' | 'appointment_not_booked'
  message: string
  time: string
  status: 'pending' | 'completed'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [salonData, setSalonData] = useState<any>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    appointmentsCreated: 0,
    requestedNotFulfilled: 0,
    totalClients: 0,
    averageResponseTime: '0 hours'
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        // Fetch salon data
        const salonDoc = await getDocs(query(collection(db, 'salons'), where('id', '==', user.uid)))
        if (!salonDoc.empty) {
          const salon = salonDoc.docs[0].data()
          setSalonData(salon)
        }

        // Fetch booking requests for this salon
        const bookingRequestsQuery = query(
          collection(db, 'bookingRequests'),
          where('salonId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
        const bookingRequestsSnapshot = await getDocs(bookingRequestsQuery)
        
        const requests = bookingRequestsSnapshot.docs.map(doc => doc.data())
        
        // Calculate stats
        const totalRequests = requests.length
        const bookedRequests = requests.filter(req => req.status === 'booked').length
        const notBookedRequests = requests.filter(req => req.status === 'not-booked').length
        const pendingRequests = requests.filter(req => req.status === 'pending').length
        
        // Get unique clients
        const uniqueClients = new Set(requests.map(req => req.clientEmail)).size
        
        setDashboardStats({
          appointmentsCreated: bookedRequests,
          requestedNotFulfilled: notBookedRequests + pendingRequests,
          totalClients: uniqueClients,
          averageResponseTime: '2.3 hours' // This would need more complex calculation
        })

        // Create recent activity from booking requests
        const activity: RecentActivity[] = requests.slice(0, 4).map(req => ({
          id: req.id || Math.random().toString(),
          type: req.status === 'booked' ? 'appointment_booked' : 
                req.status === 'not-booked' ? 'appointment_not_booked' : 'booking_request',
          message: `Booking request from ${req.clientName}`,
          time: formatTimeAgo(req.createdAt),
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

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Unknown time'
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const copyBookingUrl = () => {
    if (salonData?.bookingUrl) {
      navigator.clipboard.writeText(salonData.bookingUrl).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
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
        {salonData?.bookingUrl && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Booking URL</h2>
            <p className="text-sm text-gray-600 mb-4">
              Share this link with your clients so they can request appointments
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={salonData.bookingUrl}
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
        )}

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
                              {activity.time}
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