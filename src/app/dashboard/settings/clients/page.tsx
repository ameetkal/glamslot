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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
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
          clientMap.set(clientKey, {
            id: clientKey,
            name: request.clientName,
            email: request.clientEmail,
            phone: request.clientPhone,
            totalRequests: 0,
            completedRequests: 0,
            totalSpent: 0,
            lastRequest: request.createdAt.toString(),
            notes: request.notes || '',
            requests: [],
            hasLoyalty: false
          })
        }
        
        const client = clientMap.get(clientKey)!
        client.totalRequests++
        client.requests.push(request)
        
        // Update last request date
        const requestDate = new Date(request.createdAt)
        const lastRequestDate = new Date(client.lastRequest)
        if (requestDate > lastRequestDate) {
          client.lastRequest = request.createdAt.toString()
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
          
          clientMap.set(clientKey, {
            id: loyaltyClient.id,
            name: loyaltyClient.name,
            email: loyaltyClient.email || '',
            phone: loyaltyClient.phone || '',
            totalRequests: 0,
            completedRequests: 0,
            totalSpent: 0,
            lastRequest: loyaltyClient.createdAt?.toString() || '',
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
  })

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Clients List */}
          <div className="space-y-4">
            {filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery ? 'Try adjusting your search terms.' : 'Clients will appear here once they submit booking requests.'}
                </p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <motion.div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`w-full rounded-lg border p-4 text-left transition-all cursor-pointer ${
                    selectedClient?.id === client.id
                      ? 'border-accent-500 bg-accent-50'
                      : 'border-gray-200 bg-white hover:border-accent-300'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">
                          {client.name}
                        </span>
                        {client.hasLoyalty && (
                          <GiftIcon className="h-4 w-4 text-accent-600 flex-shrink-0" title="Loyalty Member" />
                        )}
                      </div>
                      <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-700">
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
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="text-sm text-gray-700">
                        Last request: {formatDate(client.lastRequest)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Client Details */}
          <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900">Client Details</h2>
            {selectedClient ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Contact Information</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900">{selectedClient.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <a href={`mailto:${selectedClient.email}`} className="text-accent-600 hover:text-accent-500 truncate">
                          {selectedClient.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <a href={`tel:${selectedClient.phone}`} className="text-accent-600 hover:text-accent-500">
                          {selectedClient.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Booking History</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900">
                          {selectedClient.completedRequests} of {selectedClient.totalRequests} requests completed
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CurrencyDollarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900">Estimated total spent: ${selectedClient.totalSpent}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900">Last request: {formatDate(selectedClient.lastRequest)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedClient.hasLoyalty && selectedClient.loyalty && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Loyalty Program</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <GiftIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900">
                            {selectedClient.loyalty.currentVisits} of {selectedClient.loyalty.totalVisits} visits completed
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <GiftIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900">
                            Pass ID: {selectedClient.loyalty.passId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900">
                            Joined: {formatDate(selectedClient.loyalty.passAddedAt)}
                          </span>
                        </div>
                        {selectedClient.loyalty.lastVisitAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-900">
                              Last visit: {formatDate(selectedClient.loyalty.lastVisitAt)}
                            </span>
                          </div>
                        )}
                        {selectedClient.loyalty.rewardsEarned > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <GiftIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-900">
                              {selectedClient.loyalty.rewardsEarned} rewards earned
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedClient.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Latest Notes</h3>
                      <div className="mt-2 flex items-start gap-2 text-sm">
                        <ChatBubbleLeftIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-900">{selectedClient.notes}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Recent Requests</h3>
                    <div className="mt-2 space-y-2">
                      {selectedClient.requests.slice(0, 3).map((request, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                          <div className="font-medium">{request.service}</div>
                          <div className="text-gray-600">
                            {request.stylistPreference} • {formatDate(request.createdAt.toString())}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            Status: {request.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="mt-4 text-center text-gray-500">
                <UserIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm">Select a client to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 