'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { shiftChangeRequestService, teamService } from '@/lib/firebase/services'
import { ShiftChangeRequest } from '@/types/firebase'
import { 
  CalendarIcon, 
  UserIcon, 
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

export default function StaffSchedulePage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ShiftChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return

      try {
        // Get the user's salon ID
        const userTeamMember = await teamService.getTeamMemberByUserId(user.uid)
        const salonId = userTeamMember?.salonId || user.uid
        
        const requestsData = await shiftChangeRequestService.getShiftChangeRequests(salonId)
        setRequests(requestsData)
      } catch (error) {
        console.error('Error fetching shift change requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [user])

  const updateRequestStatus = async (requestId: string, status: 'approved' | 'denied', reviewNotes?: string) => {
    try {
      await shiftChangeRequestService.updateShiftChangeRequest(requestId, {
        status,
        reviewedBy: user?.uid || '',
        reviewNotes: reviewNotes || ''
      })
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { 
          ...req, 
          status, 
          reviewedBy: user?.uid || '',
          reviewNotes: reviewNotes || '',
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${ampm}`
    } catch {
      return timeString
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'denied':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter requests based on search term and status filter
  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.reason.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRequests = filteredRequests.slice(startIndex, endIndex)

  const renderRequestCard = (request: ShiftChangeRequest) => (
    <li key={request.id}>
      <div 
        className="px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => toggleExpanded(request.id)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {request.providerName}
                </p>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {formatDate(request.currentShift.date)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatTime(request.currentShift.startTime)} - {formatTime(request.currentShift.endTime)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {request.status === 'pending' ? 'Pending' : 
               request.status === 'approved' ? 'Approved' : 'Denied'}
            </span>
            
            {/* Action buttons for pending requests */}
            {request.status === 'pending' && (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    updateRequestStatus(request.id, 'approved')
                  }}
                  className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Approve</span>
                  <span className="sm:hidden">Approve</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    updateRequestStatus(request.id, 'denied')
                  }}
                  className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Deny</span>
                  <span className="sm:hidden">Deny</span>
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
                <h4 className="font-medium text-gray-900 mb-2">Current Shift</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="ml-2 text-gray-600">{formatDate(request.currentShift.date)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Time:</span>
                    <span className="ml-2 text-gray-600">
                      {formatTime(request.currentShift.startTime)} - {formatTime(request.currentShift.endTime)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Requested Shift</h4>
                <div className="space-y-2">
                  {request.requestedShift.date ? (
                    <>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Date:</span>
                        <span className="ml-2 text-gray-600">{formatDate(request.requestedShift.date)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Time:</span>
                        <span className="ml-2 text-gray-600">
                          {formatTime(request.requestedShift.startTime)} - {formatTime(request.requestedShift.endTime)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      No specific shift requested - provider is asking for time off
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Reason for Change</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                {request.reason}
              </p>
            </div>

            {request.reviewNotes && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Review Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {request.reviewNotes}
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
            <p className="mt-4 text-gray-600">Loading shift change requests...</p>
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
            <h1 className="text-2xl font-semibold text-gray-900">Staff Schedule</h1>
            <p className="mt-2 text-sm text-gray-700">
              Review and manage shift change requests from service providers
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by provider name or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'denied')}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} requests
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-6">
          {currentRequests.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200">
                {currentRequests.map(renderRequestCard)}
              </ul>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No shift change requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No shift change requests have been submitted yet.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 