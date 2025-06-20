'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { bookingRequestService } from '@/lib/firebase/services'
import { BookingRequest } from '@/types/firebase'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  totalRequests: number
  totalBooked: number
  lastRequestDate: string
  servicesRequested: string[]
  stylistsRequested: string[]
  waitlistRequests: number
  isOnWaitlist: boolean
  requests: BookingRequest[]
}

export default function ClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showWaitlistOnly, setShowWaitlistOnly] = useState(false)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchClients = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const bookingRequests = await bookingRequestService.getBookingRequests(user.uid)
      
      // Group booking requests by client (email)
      const clientMap = new Map<string, Client>()
      
      bookingRequests.forEach((request) => {
        const clientKey = request.clientEmail.toLowerCase()
        
        if (!clientMap.has(clientKey)) {
          clientMap.set(clientKey, {
            id: clientKey,
            name: request.clientName,
            email: request.clientEmail,
            phone: request.clientPhone,
            totalRequests: 0,
            totalBooked: 0,
            lastRequestDate: request.createdAt.toString(),
            servicesRequested: [],
            stylistsRequested: [],
            waitlistRequests: 0,
            isOnWaitlist: false,
            requests: []
          })
        }
        
        const client = clientMap.get(clientKey)!
        client.totalRequests++
        client.requests.push(request)
        
        // Add service and stylist to lists
        if (request.service && !client.servicesRequested.includes(request.service)) {
          client.servicesRequested.push(request.service)
        }
        if (request.stylistPreference && !client.stylistsRequested.includes(request.stylistPreference)) {
          client.stylistsRequested.push(request.stylistPreference)
        }
        
        // Update last request date
        const requestDate = new Date(request.createdAt)
        const lastRequestDate = new Date(client.lastRequestDate)
        if (requestDate > lastRequestDate) {
          client.lastRequestDate = request.createdAt.toString()
        }
        
        // Count booked requests and waitlist requests
        if (request.status === 'booked') {
          client.totalBooked++
        }
        if (request.waitlistOptIn) {
          client.waitlistRequests++
          client.isOnWaitlist = true
        }
      })
      
      setClients(Array.from(clientMap.values()))
    } catch (error) {
      console.error('Error fetching clients:', error)
      setError('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchClients()
    }
  }, [user, fetchClients])

  // Filter clients based on search term and waitlist filter
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm)
    
    const matchesWaitlistFilter = !showWaitlistOnly || client.isOnWaitlist
    
    return matchesSearch && matchesWaitlistFilter
  })

  // Sort by most recent booking first
  const sortedClients = [...filteredClients].sort((a, b) => 
    new Date(b.lastRequestDate).getTime() - new Date(a.lastRequestDate).getTime()
  )

  const toggleExpanded = (clientId: string) => {
    setExpandedClient(expandedClient === clientId ? null : clientId)
  }

  const formatDate = (dateString: string) => {
    try {
      // Handle Firestore timestamp objects
      let date: Date
      if (typeof dateString === 'object' && dateString && 'toDate' in dateString) {
        date = (dateString as { toDate: () => Date }).toDate()
      } else {
        date = new Date(dateString)
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown date'
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Unknown date'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Clients</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <p className="mt-1 text-sm text-gray-600">
          View details of clients who have requested appointments
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search clients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-600 text-gray-900 focus:outline-none focus:placeholder-gray-500 focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
              />
            </div>
          </div>
          
          {/* Waitlist Filter Toggle */}
          <div className="flex items-center">
            <button
              onClick={() => setShowWaitlistOnly(!showWaitlistOnly)}
              className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                showWaitlistOnly
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              {showWaitlistOnly ? 'Show All Clients' : 'Waitlist Only'}
            </button>
          </div>
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {sortedClients.length === 0 ? (
          <div className="text-center py-8">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Clients will appear here once they submit booking requests.'}
            </p>
          </div>
        ) : (
          sortedClients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Client Header - Always Visible */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpanded(client.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <UserIcon className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{client.name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center mb-1 sm:mb-0">
                          <EnvelopeIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{client.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm text-gray-600">Last request</div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(client.lastRequestDate)}
                      </div>
                    </div>
                    <div className="text-right sm:hidden">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(client.lastRequestDate)}
                      </div>
                    </div>
                    {expandedClient === client.id ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
                
                {/* Mobile: Show key stats upfront */}
                <div className="sm:hidden mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-700">
                        <span className="font-medium text-gray-900">{client.totalRequests}</span> requests
                      </span>
                      <span className="text-gray-700">
                        <span className="font-medium text-green-600">{client.totalBooked}</span> booked
                      </span>
                    </div>
                    {client.isOnWaitlist && (
                      <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded">
                        Waitlist
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedClient === client.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Booking Statistics */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Booking Statistics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Total Requests:</span>
                          <span className="font-medium text-gray-900">{client.totalRequests}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Successfully Booked:</span>
                          <span className="font-medium text-green-600">{client.totalBooked}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Not Booked:</span>
                          <span className="font-medium text-red-600">{client.totalRequests - client.totalBooked}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Waitlist Requests:</span>
                          <span className="font-medium text-blue-600">{client.waitlistRequests}</span>
                        </div>
                      </div>
                    </div>

                    {/* Services Requested */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Services Requested</h4>
                      <div className="space-y-1">
                        {client.servicesRequested.length > 0 ? (
                          client.servicesRequested.map((service, index) => (
                            <div key={index} className="flex items-center text-sm">
                              <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              <span className="text-gray-700 truncate">{service}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No services requested yet</p>
                        )}
                      </div>
                    </div>

                    {/* Stylists Requested */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Stylists Requested</h4>
                      <div className="space-y-1">
                        {client.stylistsRequested.length > 0 ? (
                          client.stylistsRequested.map((stylist, index) => (
                            <div key={index} className="flex items-center text-sm">
                              <UserIcon className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                              <span className="text-gray-700 truncate">{stylist}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No stylist preferences</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Requests */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Requests</h4>
                    <div className="space-y-2">
                      {client.requests.slice(0, 5).map((request, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900">{request.service}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                {request.stylistPreference} • {formatDate(request.createdAt.toString())}
                              </div>
                            </div>
                            <div className="flex items-center mt-2 sm:mt-0 sm:ml-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                request.status === 'booked' 
                                  ? 'bg-green-100 text-green-800'
                                  : request.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {request.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
} 