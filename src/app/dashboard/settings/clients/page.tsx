"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { bookingRequestService, clientService } from '@/lib/firebase/services'
import { BookingRequest } from '@/types/firebase'
import { 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
  GiftIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  totalRequests: number
  completedRequests: number
  totalSpent: number
  lastRequest: string
  notes: string
  requests: BookingRequest[]
  loyalty?: {
    passId: string
    currentVisits: number
    totalVisits: number
    rewardsEarned: number
    loyaltyProgramId: string
    passAddedAt: string
    lastVisitAt?: string
  }
  hasLoyalty: boolean
}

export default function ClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'loyalty' | 'bookings'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  console.log('ClientsPage rendered, user:', user?.uid || 'no user')

  const fetchClients = useCallback(async () => {
    console.log('fetchClients called, user:', user?.uid || 'no user')
    if (!user) {
      console.log('No user found, returning early')
      return
    }

    try {
      setLoading(true)
      console.log('Fetching clients for salon:', user.uid)
      
      // Fetch both booking requests and direct clients
      const [bookingRequests, loyaltyClients] = await Promise.all([
        bookingRequestService.getBookingRequests(user.uid),
        clientService.getClients(user.uid)
      ])
      
      console.log('Booking requests found:', bookingRequests.length)
      console.log('Loyalty clients found:', loyaltyClients.length, loyaltyClients)
      
      // Create a map to merge data
      const clientMap = new Map<string, Client>()
      
      // Process booking requests (existing logic)
      bookingRequests.forEach((request) => {
        const clientKey = request.clientEmail.toLowerCase()
        
        if (!clientMap.has(clientKey)) {
          const initialDate = typeof request.createdAt === 'object' && 'toDate' in request.createdAt 
            ? (request.createdAt as { toDate: () => Date }).toDate().toISOString()
            : new Date(request.createdAt).toISOString()
          
          clientMap.set(clientKey, {
            id: clientKey,
            name: request.clientName,
            email: request.clientEmail,
            phone: request.clientPhone,
            totalRequests: 0,
            completedRequests: 0,
            totalSpent: 0,
            lastRequest: initialDate,
            notes: request.notes || '',
            requests: [],
            hasLoyalty: false
          })
        }
        
        const client = clientMap.get(clientKey)!
        client.totalRequests++
        client.requests.push(request)
        
        // Update last request date
        const requestDate = typeof request.createdAt === 'object' && 'toDate' in request.createdAt 
          ? (request.createdAt as { toDate: () => Date }).toDate()
          : new Date(request.createdAt)
        const lastRequestDate = new Date(client.lastRequest)
        if (requestDate > lastRequestDate) {
          client.lastRequest = requestDate.toISOString()
        }
        
        // Count completed requests (booked status)
        if (request.status === 'booked') {
          client.completedRequests++
          // Estimate spending (this would be more accurate with actual pricing)
          client.totalSpent += 75 // Default estimate
        }
      })
      
      // Process loyalty clients
      loyaltyClients.forEach((loyaltyClient) => {
        const clientKey = loyaltyClient.email?.toLowerCase() || loyaltyClient.id
        
        if (clientMap.has(clientKey)) {
          // Merge with existing client
          const existingClient = clientMap.get(clientKey)!
          if (loyaltyClient.loyalty) {
            existingClient.loyalty = {
              ...loyaltyClient.loyalty,
              passAddedAt: typeof loyaltyClient.loyalty.passAddedAt === 'object' && loyaltyClient.loyalty.passAddedAt !== null
                ? (loyaltyClient.loyalty.passAddedAt as { toDate?: () => Date }).toDate?.().toISOString() || new Date(loyaltyClient.loyalty.passAddedAt).toISOString()
                : loyaltyClient.loyalty.passAddedAt,
              lastVisitAt: loyaltyClient.loyalty.lastVisitAt 
                ? typeof loyaltyClient.loyalty.lastVisitAt === 'object' && loyaltyClient.loyalty.lastVisitAt !== null
                  ? (loyaltyClient.loyalty.lastVisitAt as { toDate?: () => Date }).toDate?.().toISOString() || new Date(loyaltyClient.loyalty.lastVisitAt).toISOString()
                  : loyaltyClient.loyalty.lastVisitAt
                : undefined
            }
          }
          existingClient.hasLoyalty = !!loyaltyClient.loyalty
          // Use loyalty client ID if available
          existingClient.id = loyaltyClient.id
        } else {
          // Add new loyalty-only client
          const normalizedLoyalty = loyaltyClient.loyalty ? {
            ...loyaltyClient.loyalty,
            passAddedAt: typeof loyaltyClient.loyalty.passAddedAt === 'object' && loyaltyClient.loyalty.passAddedAt !== null
              ? (loyaltyClient.loyalty.passAddedAt as { toDate?: () => Date }).toDate?.().toISOString() || new Date(loyaltyClient.loyalty.passAddedAt).toISOString()
              : loyaltyClient.loyalty.passAddedAt,
            lastVisitAt: loyaltyClient.loyalty.lastVisitAt 
              ? typeof loyaltyClient.loyalty.lastVisitAt === 'object' && loyaltyClient.loyalty.lastVisitAt !== null
                ? (loyaltyClient.loyalty.lastVisitAt as { toDate?: () => Date }).toDate?.().toISOString() || new Date(loyaltyClient.loyalty.lastVisitAt).toISOString()
                : loyaltyClient.loyalty.lastVisitAt
              : undefined
          } : undefined
          
          const loyaltyDate = loyaltyClient.createdAt 
            ? typeof loyaltyClient.createdAt === 'object' && 'toDate' in loyaltyClient.createdAt
              ? (loyaltyClient.createdAt as { toDate: () => Date }).toDate().toISOString()
              : new Date(loyaltyClient.createdAt).toISOString()
            : ''
          
          clientMap.set(clientKey, {
            id: loyaltyClient.id,
            name: loyaltyClient.name,
            email: loyaltyClient.email || '',
            phone: loyaltyClient.phone || '',
            totalRequests: 0,
            completedRequests: 0,
            totalSpent: 0,
            lastRequest: loyaltyDate,
            notes: '',
            requests: [],
            loyalty: normalizedLoyalty,
            hasLoyalty: !!loyaltyClient.loyalty
          })
        }
      })
      
      const finalClients = Array.from(clientMap.values())
      console.log('Final merged clients:', finalClients.length, finalClients)
      setClients(finalClients)
    } catch (error) {
      console.error('Error fetching clients:', error)
      setError('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    console.log('useEffect triggered, user:', user?.uid || 'no user')
    if (user) {
      console.log('User found, calling fetchClients')
      fetchClients()
    } else {
      console.log('No user, not calling fetchClients')
    }
  }, [user, fetchClients])

  const toggleExpanded = (clientId: string) => {
    setExpandedClient(expandedClient === clientId ? null : clientId)
  }

  const filteredClients = clients.filter(client => {
    // Apply search filter
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery)
    
    if (!matchesSearch) return false
    
    // Apply type filter
    switch (filterType) {
      case 'loyalty':
        return client.hasLoyalty
      case 'bookings':
        return client.totalRequests > 0
      case 'all':
      default:
        return true
    }
  }).sort((a, b) => {
    // Sort by lastRequest date (most recent first)
    const dateA = new Date(a.lastRequest || 0)
    const dateB = new Date(b.lastRequest || 0)
    return dateB.getTime() - dateA.getTime()
  })

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Clients</h2>
            <p className="text-gray-600">{error}</p>
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
            <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
            <p className="mt-2 text-sm text-gray-700">
              View and manage your client list, including appointment history and spending
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0">
            <Button
              variant="primary"
              className="flex items-center gap-2"
              onClick={() => {/* TODO: Implement client messaging */}}
            >
              <ChatBubbleLeftIcon className="h-4 w-4" />
              Message Clients
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative rounded-md shadow-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients by name, email, or phone..."
              className="block w-full rounded-md border-0 py-1.5 pl-4 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-600 focus:ring-2 focus:ring-inset focus:ring-accent-600 sm:text-sm sm:leading-6"
            />
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'loyalty' | 'bookings')}
              className="rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-accent-600 sm:text-sm sm:leading-6"
            >
              <option value="all">All Clients</option>
              <option value="loyalty">Loyalty Members</option>
              <option value="bookings">Booking Clients</option>
            </select>
          </div>
        </div>

        <div className="mt-8">
          {filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search terms.' : 'Clients will appear here once they submit booking requests.'}
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <li key={client.id}>
                    <div 
                      className="px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleExpanded(client.id)}
                    >
                      {/* Main client card content */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        {/* Left side - Client info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <UserIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {client.name}
                                </span>
                                {client.hasLoyalty && (
                                  <GiftIcon className="h-4 w-4 text-accent-600 flex-shrink-0" title="Loyalty Member" />
                                )}
                              </div>
                              <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>{client.completedRequests} completed</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CurrencyDollarIcon className="h-4 w-4" />
                                  <span>${client.totalSpent}</span>
                                </div>
                                {client.hasLoyalty && client.loyalty && (
                                  <div className="flex items-center gap-1">
                                    <GiftIcon className="h-4 w-4" />
                                    <span>{client.loyalty.currentVisits}/{client.loyalty.totalVisits} visits</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right side - Last request date and expand button */}
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-sm text-gray-700">
                              Last request: {formatDate(client.lastRequest)}
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpanded(client.id)
                            }}
                            className="inline-flex items-center p-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
                          >
                            {expandedClient === client.id ? (
                              <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {expandedClient === client.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-200"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-gray-900">{client.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <a href={`mailto:${client.email}`} className="text-accent-600 hover:text-accent-500 truncate">
                                    {client.email}
                                  </a>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <a href={`tel:${client.phone}`} className="text-accent-600 hover:text-accent-500">
                                    {client.phone}
                                  </a>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Booking History</h4>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-gray-900">
                                    {client.completedRequests} of {client.totalRequests} requests completed
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-gray-900">Estimated total spent: ${client.totalSpent}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-gray-900">Last request: {formatDate(client.lastRequest)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {client.hasLoyalty && client.loyalty && (
                            <div className="mt-4">
                              <h4 className="font-medium text-gray-900 mb-3">Loyalty Program</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <GiftIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-900">
                                      {client.loyalty.currentVisits} of {client.loyalty.totalVisits} visits completed
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <GiftIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-900">
                                      Pass ID: {client.loyalty.passId}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-900">
                                      Joined: {formatDate(client.loyalty.passAddedAt)}
                                    </span>
                                  </div>
                                  {client.loyalty.lastVisitAt && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                      <span className="text-gray-900">
                                        Last visit: {formatDate(client.loyalty.lastVisitAt)}
                                      </span>
                                    </div>
                                  )}
                                  {client.loyalty.rewardsEarned > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <GiftIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                      <span className="text-gray-900">
                                        {client.loyalty.rewardsEarned} rewards earned
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {client.notes && (
                            <div className="mt-4">
                              <h4 className="font-medium text-gray-900 mb-2">Latest Notes</h4>
                              <div className="flex items-start gap-2 text-sm">
                                <ChatBubbleLeftIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{client.notes}</p>
                              </div>
                            </div>
                          )}

                          <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-2">Recent Requests</h4>
                            <div className="space-y-2">
                              {client.requests.slice(0, 3).map((request, index) => (
                                <div key={index} className="text-sm bg-gray-50 p-3 rounded-md">
                                  <div className="font-medium">{request.service}</div>
                                  <div className="text-gray-600 mt-1">
                                    {request.stylistPreference} • {formatDate(request.createdAt.toString())}
                                  </div>
                                  <div className="text-xs text-gray-500 capitalize mt-1">
                                    Status: {request.status}
                                  </div>
                                </div>
                              ))}
                              {client.requests.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No booking requests yet</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 