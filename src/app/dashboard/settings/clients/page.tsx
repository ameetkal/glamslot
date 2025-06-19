'use client'

import { useState } from 'react'
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

// Mock data - in real app this would come from booking requests history
const sampleClients = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '555-123-4567',
    totalRequests: 3,
    totalBooked: 2,
    lastRequestDate: '2024-01-15',
    servicesRequested: ['Haircut & Style', 'Color Treatment', 'Haircut & Style'],
    stylistsRequested: ['Alice Smith', 'Bob Johnson', 'Alice Smith'],
    waitlistRequests: 1,
    isOnWaitlist: false
  },
  {
    id: 2,
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    phone: '555-987-6543',
    totalRequests: 5,
    totalBooked: 4,
    lastRequestDate: '2024-01-16',
    servicesRequested: ['Beard Trim', 'Haircut', 'Beard Trim', 'Haircut', 'Beard Trim'],
    stylistsRequested: ['Bob Johnson', 'Alice Smith', 'Bob Johnson', 'Alice Smith', 'Bob Johnson'],
    waitlistRequests: 0,
    isOnWaitlist: false
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    phone: '555-456-7890',
    totalRequests: 2,
    totalBooked: 0,
    lastRequestDate: '2024-01-17',
    servicesRequested: ['Full Color Treatment', 'Balayage'],
    stylistsRequested: ['Alice Smith', 'Bob Johnson'],
    waitlistRequests: 2,
    isOnWaitlist: true
  },
  {
    id: 4,
    name: 'David Kim',
    email: 'david.kim@email.com',
    phone: '555-321-6540',
    totalRequests: 1,
    totalBooked: 1,
    lastRequestDate: '2024-01-14',
    servicesRequested: ['Haircut'],
    stylistsRequested: ['Alice Smith'],
    waitlistRequests: 0,
    isOnWaitlist: false
  },
  {
    id: 5,
    name: 'Jessica Williams',
    email: 'jessica.williams@email.com',
    phone: '555-789-0123',
    totalRequests: 4,
    totalBooked: 3,
    lastRequestDate: '2024-01-13',
    servicesRequested: ['Highlights', 'Haircut', 'Color Treatment', 'Haircut'],
    stylistsRequested: ['Bob Johnson', 'Alice Smith', 'Bob Johnson', 'Alice Smith'],
    waitlistRequests: 1,
    isOnWaitlist: false
  }
]

export default function ClientsPage() {
  const [clients] = useState(sampleClients)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedClient, setExpandedClient] = useState<number | null>(null)

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  )

  // Sort by most recent booking first
  const sortedClients = [...filteredClients].sort((a, b) => 
    new Date(b.lastRequestDate).getTime() - new Date(a.lastRequestDate).getTime()
  )

  const toggleExpanded = (clientId: number) => {
    setExpandedClient(expandedClient === clientId ? null : clientId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search clients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
          />
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {sortedClients.map((client) => (
          <div key={client.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Client Header - Always Visible */}
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpanded(client.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <UserIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        {client.email}
                      </div>
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        {client.phone}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Last request</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(client.lastRequestDate)}
                    </div>
                  </div>
                  {expandedClient === client.id ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedClient === client.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Booking Statistics */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Booking Statistics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Requests:</span>
                        <span className="font-medium">{client.totalRequests}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Successfully Booked:</span>
                        <span className="font-medium text-green-600">{client.totalBooked}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Not Booked:</span>
                        <span className="font-medium text-red-600">{client.totalRequests - client.totalBooked}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Waitlist Requests:</span>
                        <span className="font-medium text-orange-600">{client.waitlistRequests}</span>
                      </div>
                    </div>
                  </div>

                  {/* Services Requested */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Services Requested</h4>
                    <div className="space-y-1">
                      {[...new Set(client.servicesRequested)].map((service, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          • {service}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stylists Requested */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Stylists Requested</h4>
                    <div className="space-y-1">
                      {[...new Set(client.stylistsRequested)].map((stylist, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          • {stylist}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Waitlist Status */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">Waitlist Status</span>
                    </div>
                    {client.isOnWaitlist ? (
                      <div className="flex items-center text-orange-600">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">On Waitlist</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500">
                        <CheckIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm">Not on waitlist</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sortedClients.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Clients will appear here once they request appointments.'}
          </p>
        </div>
      )}
    </div>
  )
} 