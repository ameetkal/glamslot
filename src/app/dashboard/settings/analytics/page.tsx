"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { bookingRequestService } from '@/lib/firebase/services'
import { BookingRequest } from '@/types/firebase'
import { 
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChartBarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'

interface UserStats {
  email: string
  name: string
  phone: string
  totalRequests: number
  completedRequests: number
  pendingRequests: number
  notBookedRequests: number
  completionRate: number
  firstRequestDate: string
  lastRequestDate: string
  requestHistory: BookingRequest[]
}

interface OverallStats {
  totalUsers: number
  totalRequests: number
  totalCompleted: number
  totalPending: number
  totalNotBooked: number
  averageCompletionRate: number
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [userStats, setUserStats] = useState<UserStats[]>([])
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalUsers: 0,
    totalRequests: 0,
    totalCompleted: 0,
    totalPending: 0,
    totalNotBooked: 0,
    averageCompletionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'totalRequests' | 'completionRate' | 'lastRequest'>('totalRequests')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchAnalyticsData = useCallback(async () => {
    if (!user) return

    try {
      setRefreshing(true)
      console.log('Fetching booking requests for analytics...')
      
      // Get all booking requests for this salon
      const bookingRequests = await bookingRequestService.getBookingRequests(user.uid)
      console.log(`Found ${bookingRequests.length} booking requests`)

      // Group by user email and calculate stats
      const userStatsMap = new Map<string, UserStats>()

      bookingRequests.forEach((request) => {
        const email = request.clientEmail.toLowerCase()
        
        if (!userStatsMap.has(email)) {
          userStatsMap.set(email, {
            email: request.clientEmail,
            name: request.clientName,
            phone: request.clientPhone,
            totalRequests: 0,
            completedRequests: 0,
            pendingRequests: 0,
            notBookedRequests: 0,
            completionRate: 0,
            firstRequestDate: request.createdAt.toString(),
            lastRequestDate: request.createdAt.toString(),
            requestHistory: []
          })
        }

        const stats = userStatsMap.get(email)!
        stats.totalRequests++
        stats.requestHistory.push(request)

        // Count by status
        switch (request.status) {
          case 'booked':
            stats.completedRequests++
            break
          case 'pending':
            stats.pendingRequests++
            break
          case 'not-booked':
            stats.notBookedRequests++
            break
        }

        // Update dates
        const requestDate = new Date(request.createdAt)
        const firstDate = new Date(stats.firstRequestDate)
        const lastDate = new Date(stats.lastRequestDate)

        if (requestDate < firstDate) {
          stats.firstRequestDate = request.createdAt.toString()
        }
        if (requestDate > lastDate) {
          stats.lastRequestDate = request.createdAt.toString()
        }
      })

      // Calculate completion rates and convert to array
      const statsArray = Array.from(userStatsMap.values()).map(stats => ({
        ...stats,
        completionRate: stats.totalRequests > 0 
          ? Math.round((stats.completedRequests / stats.totalRequests) * 100) 
          : 0
      }))

      // Calculate overall stats
      const totalUsers = statsArray.length
      const totalRequests = statsArray.reduce((sum, user) => sum + user.totalRequests, 0)
      const totalCompleted = statsArray.reduce((sum, user) => sum + user.completedRequests, 0)
      const totalPending = statsArray.reduce((sum, user) => sum + user.pendingRequests, 0)
      const totalNotBooked = statsArray.reduce((sum, user) => sum + user.notBookedRequests, 0)
      const averageCompletionRate = totalUsers > 0 
        ? Math.round(statsArray.reduce((sum, user) => sum + user.completionRate, 0) / totalUsers)
        : 0

      setUserStats(statsArray)
      setOverallStats({
        totalUsers,
        totalRequests,
        totalCompleted,
        totalPending,
        totalNotBooked,
        averageCompletionRate
      })

      console.log('Analytics data processed:', { totalUsers, totalRequests })
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  const handleRefresh = () => {
    fetchAnalyticsData()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const filteredAndSortedUsers = userStats
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm)
    )
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'totalRequests':
          comparison = a.totalRequests - b.totalRequests
          break
        case 'completionRate':
          comparison = a.completionRate - b.completionRate
          break
        case 'lastRequest':
          comparison = new Date(a.lastRequestDate).getTime() - new Date(b.lastRequestDate).getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics data...</p>
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
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">User Analytics</h1>
            <p className="mt-2 text-sm text-gray-700">
              Detailed statistics about your users and their booking patterns
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        {/* Overall Stats Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{overallStats.totalUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">Total Requests</dt>
                    <dd className="text-lg font-medium text-gray-900">{overallStats.totalRequests}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">Completed</dt>
                    <dd className="text-lg font-medium text-gray-900">{overallStats.totalCompleted}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-accent-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">Avg Completion Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">{overallStats.averageCompletionRate}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">User Statistics</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table Headers */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-6 gap-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              <button
                onClick={() => handleSort('name')}
                className="flex items-center space-x-1 hover:text-gray-900"
              >
                <span>User</span>
                {sortBy === 'name' && (
                  <span className="text-accent-600">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSort('totalRequests')}
                className="flex items-center space-x-1 hover:text-gray-900"
              >
                <span>Total Requests</span>
                {sortBy === 'totalRequests' && (
                  <span className="text-accent-600">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
              <span>Completed</span>
              <span>Pending</span>
              <button
                onClick={() => handleSort('completionRate')}
                className="flex items-center space-x-1 hover:text-gray-900"
              >
                <span>Completion Rate</span>
                {sortBy === 'completionRate' && (
                  <span className="text-accent-600">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSort('lastRequest')}
                className="flex items-center space-x-1 hover:text-gray-900"
              >
                <span>Last Request</span>
                {sortBy === 'lastRequest' && (
                  <span className="text-accent-600">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* User Data */}
          <div className="divide-y divide-gray-200">
            {filteredAndSortedUsers.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'No booking requests have been made yet.'}
                </p>
              </div>
            ) : (
              filteredAndSortedUsers.map((userStat) => (
                <div key={userStat.email} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    {/* User Info */}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-accent-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-accent-700">
                              {userStat.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {userStat.name}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {userStat.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Total Requests */}
                    <div className="text-sm text-gray-900 font-medium">
                      {userStat.totalRequests}
                    </div>

                    {/* Completed */}
                    <div className="flex items-center space-x-1">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-900">{userStat.completedRequests}</span>
                    </div>

                    {/* Pending */}
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-900">{userStat.pendingRequests}</span>
                    </div>

                    {/* Completion Rate */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-accent-600 h-2 rounded-full" 
                          style={{ width: `${userStat.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 min-w-0">
                        {userStat.completionRate}%
                      </span>
                    </div>

                    {/* Last Request */}
                    <div className="text-sm text-gray-600">
                      {formatDate(userStat.lastRequestDate)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{overallStats.totalCompleted}</div>
              <div className="text-gray-600">Total Appointments Booked</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{overallStats.totalPending}</div>
              <div className="text-gray-600">Pending Requests</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{overallStats.totalNotBooked}</div>
              <div className="text-gray-600">Not Booked</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 