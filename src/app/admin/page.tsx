"use client"

import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { BookingRequest, Salon } from '@/types/firebase'
import { useAuth } from '@/lib/auth'
import { 
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'

interface SalonStats {
  id: string
  name: string
  slug: string
  ownerEmail: string
  totalRequests: number
  completedRequests: number
  pendingRequests: number
  notBookedRequests: number
  completionRate: number
  createdAt: Date
  lastActivity?: Date
  isActive: boolean
}

interface PlatformStats {
  totalSalons: number
  activeSalons: number
  totalRequests: number
  totalCompleted: number
  totalPending: number
  totalNotBooked: number
  overallCompletionRate: number
  newSalonsThisMonth: number
  avgRequestsPerSalon: number
}

export default function SuperAdminPage() {
  const { user } = useAuth()
  const [salonStats, setSalonStats] = useState<SalonStats[]>([])
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalSalons: 0,
    activeSalons: 0,
    totalRequests: 0,
    totalCompleted: 0,
    totalPending: 0,
    totalNotBooked: 0,
    overallCompletionRate: 0,
    newSalonsThisMonth: 0,
    avgRequestsPerSalon: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'totalRequests' | 'completionRate' | 'lastActivity' | 'createdAt'>('totalRequests')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchSuperAdminData = useCallback(async () => {
    try {
      setRefreshing(true)
      console.log('Fetching super admin data...')

      // Get all salons
      const salonsQuery = query(collection(db, 'salons'), orderBy('createdAt', 'desc'))
      const salonsSnapshot = await getDocs(salonsQuery)
      const salons = salonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Salon[]

      console.log(`Found ${salons.length} salons`)

      // Get all booking requests
      const requestsQuery = query(collection(db, 'bookingRequests'), orderBy('createdAt', 'desc'))
      const requestsSnapshot = await getDocs(requestsQuery)
      const allRequests = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookingRequest[]

      console.log(`Found ${allRequests.length} total booking requests`)

      // Group requests by salon
      const requestsBySalon = new Map<string, BookingRequest[]>()
      allRequests.forEach(request => {
        if (!requestsBySalon.has(request.salonId)) {
          requestsBySalon.set(request.salonId, [])
        }
        requestsBySalon.get(request.salonId)!.push(request)
      })

             // Calculate stats for each salon
       const currentDate = new Date()
       const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

      const salonStatsArray: SalonStats[] = salons.map(salon => {
        const requests = requestsBySalon.get(salon.id) || []
        const completedRequests = requests.filter(r => r.status === 'booked').length
        const pendingRequests = requests.filter(r => r.status === 'pending').length
        const notBookedRequests = requests.filter(r => r.status === 'not-booked').length

        // Find last activity (most recent request)
        let lastActivity: Date | undefined
        if (requests.length > 0) {
          const sortedRequests = requests.sort((a, b) => {
            const dateA = typeof a.createdAt === 'object' && 'toDate' in a.createdAt 
              ? (a.createdAt as { toDate: () => Date }).toDate() 
              : new Date(a.createdAt)
            const dateB = typeof b.createdAt === 'object' && 'toDate' in b.createdAt 
              ? (b.createdAt as { toDate: () => Date }).toDate() 
              : new Date(b.createdAt)
            return dateB.getTime() - dateA.getTime()
          })
          
          const latestRequest = sortedRequests[0]
          lastActivity = typeof latestRequest.createdAt === 'object' && 'toDate' in latestRequest.createdAt 
            ? (latestRequest.createdAt as { toDate: () => Date }).toDate()
            : new Date(latestRequest.createdAt)
        }

        const completionRate = requests.length > 0 
          ? Math.round((completedRequests / requests.length) * 100) 
          : 0

        // Consider salon "active" if they have activity in the last 30 days
        const isActive = lastActivity ? (currentDate.getTime() - lastActivity.getTime()) < (30 * 24 * 60 * 60 * 1000) : false

        return {
          id: salon.id,
          name: salon.name || 'Unnamed Salon',
          slug: salon.slug || '',
          ownerEmail: salon.ownerEmail || 'N/A',
          totalRequests: requests.length,
          completedRequests,
          pendingRequests,
          notBookedRequests,
          completionRate,
          createdAt: typeof salon.createdAt === 'object' && 'toDate' in salon.createdAt 
            ? (salon.createdAt as { toDate: () => Date }).toDate()
            : new Date(salon.createdAt),
          lastActivity,
          isActive
        }
      })

      // Calculate platform stats
      const totalSalons = salonStatsArray.length
      const activeSalons = salonStatsArray.filter(s => s.isActive).length
      const totalRequests = salonStatsArray.reduce((sum, s) => sum + s.totalRequests, 0)
      const totalCompleted = salonStatsArray.reduce((sum, s) => sum + s.completedRequests, 0)
      const totalPending = salonStatsArray.reduce((sum, s) => sum + s.pendingRequests, 0)
      const totalNotBooked = salonStatsArray.reduce((sum, s) => sum + s.notBookedRequests, 0)
      const overallCompletionRate = totalRequests > 0 ? Math.round((totalCompleted / totalRequests) * 100) : 0
      const newSalonsThisMonth = salonStatsArray.filter(s => s.createdAt >= thisMonth).length
      const avgRequestsPerSalon = totalSalons > 0 ? Math.round(totalRequests / totalSalons) : 0

      setSalonStats(salonStatsArray)
      setPlatformStats({
        totalSalons,
        activeSalons,
        totalRequests,
        totalCompleted,
        totalPending,
        totalNotBooked,
        overallCompletionRate,
        newSalonsThisMonth,
        avgRequestsPerSalon
      })

      console.log('Super admin data processed successfully')
    } catch (error) {
      console.error('Error fetching super admin data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    // Debug: Log current user info
    console.log('Admin page - Current user:', {
      email: user?.email,
      uid: user?.uid,
      displayName: user?.displayName,
      isAuthenticated: !!user
    })
    
    if (!user) {
      console.log('No user found - user is null or undefined')
      return
    }
    
    fetchSuperAdminData()
  }, [fetchSuperAdminData, user])

  const handleRefresh = () => {
    fetchSuperAdminData()
  }

  const formatDate = (date: Date) => {
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

  const filteredAndSortedSalons = salonStats
    .filter(salon => 
      salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.slug.toLowerCase().includes(searchTerm.toLowerCase())
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
        case 'lastActivity':
          const aTime = a.lastActivity?.getTime() || 0
          const bTime = b.lastActivity?.getTime() || 0
          comparison = aTime - bTime
          break
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading platform data...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Glammatic Super Admin</h1>
            <p className="mt-2 text-sm text-gray-700">
              Platform-wide analytics and salon management
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

        {/* Platform Overview Stats */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">Total Salons</dt>
                    <dd className="text-lg font-medium text-gray-900">{platformStats.totalSalons}</dd>
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
                    <dd className="text-lg font-medium text-gray-900">{platformStats.totalRequests}</dd>
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
                    <dt className="text-sm font-medium text-gray-700 truncate">Overall Completion</dt>
                    <dd className="text-lg font-medium text-gray-900">{platformStats.overallCompletionRate}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">Active Salons</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {platformStats.activeSalons} / {platformStats.totalSalons}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">Avg Requests/Salon</dt>
                    <dd className="text-lg font-medium text-gray-900">{platformStats.avgRequestsPerSalon}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">New This Month</dt>
                    <dd className="text-lg font-medium text-gray-900">{platformStats.newSalonsThisMonth}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">Pending Platform</dt>
                    <dd className="text-lg font-medium text-gray-900">{platformStats.totalPending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Salon Details Table */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Salon Details</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search salons..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table Headers */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-7 gap-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              <button
                onClick={() => handleSort('name')}
                className="flex items-center space-x-1 hover:text-gray-900"
              >
                <span>Salon</span>
                {sortBy === 'name' && (
                  <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => handleSort('totalRequests')}
                className="flex items-center space-x-1 hover:text-gray-900"
              >
                <span>Requests</span>
                {sortBy === 'totalRequests' && (
                  <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <span>Completed</span>
              <span>Pending</span>
              <button
                onClick={() => handleSort('completionRate')}
                className="flex items-center space-x-1 hover:text-gray-900"
              >
                <span>Rate</span>
                {sortBy === 'completionRate' && (
                  <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => handleSort('lastActivity')}
                className="flex items-center space-x-1 hover:text-gray-900"
              >
                <span>Last Activity</span>
                {sortBy === 'lastActivity' && (
                  <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => handleSort('createdAt')}
                className="flex items-center space-x-1 hover:text-gray-900"
              >
                <span>Created</span>
                {sortBy === 'createdAt' && (
                  <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
          </div>

          {/* Salon Data */}
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredAndSortedSalons.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No salons found</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'No salons have signed up yet.'}
                </p>
              </div>
            ) : (
              filteredAndSortedSalons.map((salon) => (
                <div key={salon.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-7 gap-4 items-center">
                    {/* Salon Info */}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            salon.isActive ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <span className={`text-sm font-medium ${
                              salon.isActive ? 'text-green-700' : 'text-gray-700'
                            }`}>
                              {salon.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {salon.name}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {salon.ownerEmail}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Total Requests */}
                    <div className="text-sm text-gray-900 font-medium">
                      {salon.totalRequests}
                    </div>

                    {/* Completed */}
                    <div className="flex items-center space-x-1">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-900">{salon.completedRequests}</span>
                    </div>

                    {/* Pending */}
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-900">{salon.pendingRequests}</span>
                    </div>

                    {/* Completion Rate */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${salon.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 min-w-0">
                        {salon.completionRate}%
                      </span>
                    </div>

                    {/* Last Activity */}
                    <div className="text-sm text-gray-600">
                      {salon.lastActivity ? formatDate(salon.lastActivity) : 'Never'}
                    </div>

                    {/* Created Date */}
                    <div className="text-sm text-gray-600">
                      {formatDate(salon.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}