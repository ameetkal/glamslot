'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { BookingRequest, Salon } from '@/types/firebase'
import { 
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon
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

// Helper function to check if user is a platform admin
function isPlatformAdmin(userEmail: string | null | undefined): boolean {
  if (!userEmail) return false
  
  const adminEmails = [
    'ameet@gofisherman.com',
    'ameetk96@gmail.com',
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
    avgRequestsPerSalon: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'totalRequests' | 'completionRate' | 'lastActivity' | 'createdAt'>('totalRequests')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Check if user has platform admin access
  if (!isPlatformAdmin(user?.email)) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access platform admin data.</p>
          </div>
        </div>
      </div>
    )
  }

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

      console.log('Platform admin data processed successfully')
    } catch (error) {
      console.error('Error fetching platform admin data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchPlatformAdminData()
  }, [fetchPlatformAdminData])

  const handleRefresh = () => {
    fetchPlatformAdminData()
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
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Detailed Stats */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Salon Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                    Salon Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('totalRequests')}>
                    Total Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('completionRate')}>
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('lastActivity')}>
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('createdAt')}>
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedSalons.map((salon) => (
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
                        <span className="text-sm text-gray-900">{salon.completionRate}%</span>
                        <div className="ml-2 flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${salon.completionRate}%` }}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 