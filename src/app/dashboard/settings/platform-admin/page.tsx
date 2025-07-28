'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { BookingRequest, Salon } from '@/types/firebase'
import { 
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon
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
  totalAppointments: number
  recentAppointments: number
  appointmentCompletionRate: number
  totalRequestsCount: number
  recentRequests: number
  requestCompletionRate: number
}

// Helper function to check if user is a platform admin
function isPlatformAdmin(userEmail: string | null | undefined): boolean {
  if (!userEmail) return false
  
  const adminEmails = [
    'ameet@gofisherman.com',
    'ameetk96@gmail.com',
    'ameet@gofishemran.com', // Added the correct spelling
    // Add any other platform admin emails here
  ]
  
  return adminEmails.includes(userEmail)
}

export default function PlatformAdminPage() {
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
    avgRequestsPerSalon: 0,
    totalAppointments: 0,
    recentAppointments: 0,
    appointmentCompletionRate: 0,
    totalRequestsCount: 0,
    recentRequests: 0,
    requestCompletionRate: 0
  })
  const [allRequests, setAllRequests] = useState<BookingRequest[]>([])
  const [allSalons, setAllSalons] = useState<Salon[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'totalRequests' | 'completionRate' | 'lastActivity' | 'createdAt'>('totalRequests')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchPlatformAdminData = useCallback(async () => {
    try {
      setRefreshing(true)
      console.log('Fetching platform admin data...')
      console.log('Current user email:', user?.email)

      // Get all salons
      const salonsQuery = query(collection(db, 'salons'), orderBy('createdAt', 'desc'))
      const salonsSnapshot = await getDocs(salonsQuery)
      const salons = salonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Salon[]

      console.log(`Found ${salons.length} salons:`, salons.map(s => ({ id: s.id, name: s.name })))

      // Get all booking requests
      const requestsQuery = query(collection(db, 'bookingRequests'), orderBy('createdAt', 'desc'))
      const requestsSnapshot = await getDocs(requestsQuery)
      const allRequests = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookingRequest[]

      console.log(`Found ${allRequests.length} total booking requests:`, allRequests.map(r => ({ id: r.id, salonId: r.salonId, status: r.status })))

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

      // Calculate appointment stats
      const bookedRequests = allRequests.filter(r => r.status === 'booked')
      const totalAppointments = bookedRequests.length
      const recentAppointments = bookedRequests.filter(r => {
        const requestDate = typeof r.createdAt === 'object' && 'toDate' in r.createdAt 
          ? (r.createdAt as { toDate: () => Date }).toDate()
          : new Date(r.createdAt)
        return requestDate >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }).length
      const appointmentCompletionRate = totalRequests > 0 ? Math.round((totalAppointments / totalRequests) * 100) : 0

      // Calculate request stats (all requests, not just booked)
      const totalRequestsCount = allRequests.length
      const recentRequests = allRequests.filter(r => {
        const requestDate = typeof r.createdAt === 'object' && 'toDate' in r.createdAt 
          ? (r.createdAt as { toDate: () => Date }).toDate()
          : new Date(r.createdAt)
        return requestDate >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }).length
      const requestCompletionRate = totalRequestsCount > 0 ? Math.round((totalAppointments / totalRequestsCount) * 100) : 0


      
      setSalonStats(salonStatsArray)
      setAllSalons(salons) // Store all salons
      setAllRequests(allRequests) // Store all requests
      setPlatformStats({
        totalSalons,
        activeSalons,
        totalRequests,
        totalCompleted,
        totalPending,
        totalNotBooked,
        overallCompletionRate,
        newSalonsThisMonth,
        avgRequestsPerSalon,
        totalAppointments,
        recentAppointments,
        appointmentCompletionRate,
        totalRequestsCount,
        recentRequests,
        requestCompletionRate
      })

      console.log('Platform admin data processed successfully')
    } catch (error) {
      console.error('Error fetching platform admin data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.email])

  useEffect(() => {
    fetchPlatformAdminData()
  }, [fetchPlatformAdminData])



  // Move the admin check here, after all hooks
  if (!isPlatformAdmin(user?.email)) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600">You don&apos;t have permission to access platform admin data.</p>
      </div>
    )
  }

  const handleRefresh = () => {
    fetchPlatformAdminData()
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
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading platform data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Platform Admin</h1>
          <p className="mt-2 text-sm text-gray-700">
            Overview of all salons and platform performance
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Salons</dt>
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
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Salons</dt>
                  <dd className="text-lg font-medium text-gray-900">{platformStats.activeSalons}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Requests</dt>
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
                <ChartBarIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completion Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">{platformStats.overallCompletionRate}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Requests</dt>
                  <dd className="text-lg font-medium text-gray-900">{platformStats.totalRequestsCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Recent (30 days)</dt>
                  <dd className="text-lg font-medium text-gray-900">{platformStats.recentRequests}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Booking Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">{platformStats.requestCompletionRate}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">{platformStats.totalCompleted}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">{platformStats.totalPending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Not Booked</dt>
                  <dd className="text-lg font-medium text-gray-900">{platformStats.totalNotBooked}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search salons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Salons Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Salon Performance</h3>
          <p className="mt-1 text-sm text-gray-500">
            Showing {filteredAndSortedSalons.length} of {salonStats.length} salons
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  Salon Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('totalRequests')}>
                  Total Requests
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('completionRate')}>
                  Completion Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('lastActivity')}>
                  Last Activity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('createdAt')}>
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedSalons.length > 0 ? (
                filteredAndSortedSalons.map((salon) => (
                  <tr key={salon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{salon.name}</div>
                        <div className="text-sm text-gray-500">{salon.ownerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {salon.totalRequests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">{salon.completionRate}%</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-20">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(salon.completionRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salon.lastActivity ? formatDate(salon.lastActivity) : 'No activity'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(salon.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        salon.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {salon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No salons found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Booking Requests */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Booking Requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            Showing last 20 of {allRequests.length} booking requests across the platform
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested On
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allRequests.length > 0 ? (
                allRequests
                  .slice(0, 20) // Show last 20 requests
                  .map((request: BookingRequest) => {
                    const salon = allSalons.find((s: Salon) => s.id === request.salonId)
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm text-gray-500 truncate" title={salon?.name || 'Unknown Business'}>
                              {salon?.name || 'Unknown Business'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'booked' ? 'bg-green-100 text-green-800' :
                            request.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status === 'pending' ? 'Pending' : 
                             request.status === 'booked' ? 'Booked' : 
                             request.status === 'contacted' ? 'Contacted' : 'Not Booked'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm font-medium text-gray-900 truncate" title={request.clientName || 'Unknown'}>
                              {request.clientName || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500 truncate" title={request.clientEmail || 'No email'}>
                              {request.clientEmail || 'No email'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm text-gray-500 truncate" title={request.service || 'No service specified'}>
                              {request.service || 'No service specified'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm text-gray-500 truncate" title={request.dateTimePreference || 'No preference'}>
                              {request.dateTimePreference || 'No preference'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm text-gray-500 truncate" title={request.stylistPreference || 'No preference'}>
                              {request.stylistPreference || 'No preference'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center py-8">
                      <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-sm font-medium text-gray-900 mb-2">No requests</h3>
                      <p className="text-sm text-gray-500">
                        No booking requests found across the platform.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
