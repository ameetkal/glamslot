'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { bookingRequestService } from '@/lib/firebase/services'
import { SessionTrackingService } from '@/lib/sessionTracking'
import { 
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  totalRequests: number
  totalBookingsMade: number
  totalBookingsNotMade: number
  totalUniqueSessions: number
  formCompletionRate: number
  recentActivity: Array<{
    type: 'booking_request' | 'booking_made' | 'booking_not_made' | 'session_start'
    message: string
    timestamp: Date
  }>
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRequests: 0,
    totalBookingsMade: 0,
    totalBookingsNotMade: 0,
    totalUniqueSessions: 0,
    formCompletionRate: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return

      try {
        setLoading(true)
        
        // Fetch all booking requests for this salon
        const bookingRequests = await bookingRequestService.getBookingRequests(user.uid)
        
        // Get session tracking data
        const sessionTracking = SessionTrackingService.getInstance()
        const sessionData = await sessionTracking.getAnalyticsData(user.uid)
        
        // Calculate basic metrics
        const totalRequests = bookingRequests.length
        const totalBookingsMade = bookingRequests.filter(req => req.status === 'booked').length
        const totalBookingsNotMade = bookingRequests.filter(req => req.status === 'not-booked').length
        
        // Use real session data
        const totalUniqueSessions = sessionData.totalSessions
        const formCompletionRate = sessionData.formCompletionRate
        
        // Create recent activity from booking requests
        const recentActivity = bookingRequests
          .slice(0, 10) // Last 10 requests
          .map(req => ({
            type: (req.status === 'booked' ? 'booking_made' : 
                   req.status === 'not-booked' ? 'booking_not_made' : 'booking_request') as 'booking_request' | 'booking_made' | 'booking_not_made' | 'session_start',
            message: req.status === 'booked' ? `Booking confirmed for ${req.clientName}` :
                    req.status === 'not-booked' ? `Booking declined for ${req.clientName}` :
                    `New booking request from ${req.clientName}`,
            timestamp: typeof req.createdAt === 'object' && req.createdAt && 'toDate' in req.createdAt 
              ? (req.createdAt as { toDate: () => Date }).toDate() 
              : new Date(req.createdAt)
          }))
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

        setAnalytics({
          totalRequests,
          totalBookingsMade,
          totalBookingsNotMade,
          totalUniqueSessions,
          formCompletionRate,
          recentActivity
        })

      } catch (error) {
        console.error('Error fetching analytics:', error)
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user])

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'totalRequests':
        return <DocumentTextIcon className="h-6 w-6 text-blue-400" />
      case 'totalBookingsMade':
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />
      case 'totalBookingsNotMade':
        return <XCircleIcon className="h-6 w-6 text-red-400" />
      case 'totalUniqueSessions':
        return <EyeIcon className="h-6 w-6 text-purple-400" />
      case 'formCompletionRate':
        return <ArrowTrendingUpIcon className="h-6 w-6 text-accent-400" />
      default:
        return <ChartBarIcon className="h-6 w-6 text-gray-400" />
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking_made':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'booking_not_made':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      case 'booking_request':
        return <DocumentTextIcon className="h-4 w-4 text-blue-500" />
      case 'session_start':
        return <EyeIcon className="h-4 w-4 text-purple-500" />
      default:
        return <CalendarIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          </div>
          <div className="mt-4 sm:mt-0">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-md hover:bg-accent-700 transition">
              <ChartBarIcon className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getMetricIcon('totalRequests')}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">Total Requests</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.totalRequests}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getMetricIcon('totalBookingsMade')}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">Bookings Made</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.totalBookingsMade}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getMetricIcon('totalBookingsNotMade')}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">Not Booked</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.totalBookingsNotMade}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getMetricIcon('totalUniqueSessions')}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">Unique Sessions</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.totalUniqueSessions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getMetricIcon('formCompletionRate')}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">Completion Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.formCompletionRate}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {analytics.recentActivity.length > 0 ? (
                analytics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-600">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Start receiving booking requests to see activity here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 