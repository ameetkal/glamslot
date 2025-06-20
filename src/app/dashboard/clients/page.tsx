"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'

// Mock data for the prototype
const clients = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 123-4567',
    totalAppointments: 5,
    completedAppointments: 4,
    totalSpent: 425,
    lastAppointment: '2024-03-15',
    notes: 'Prefers morning appointments',
  },
  {
    id: 2,
    name: 'Mike Chen',
    email: 'mike.c@email.com',
    phone: '(555) 987-6543',
    totalAppointments: 3,
    completedAppointments: 3,
    totalSpent: 285,
    lastAppointment: '2024-03-10',
    notes: 'Regular client, always books balayage',
  },
  {
    id: 3,
    name: 'Emma Davis',
    email: 'emma.d@email.com',
    phone: '(555) 456-7890',
    totalAppointments: 2,
    completedAppointments: 1,
    totalSpent: 135,
    lastAppointment: '2024-03-18',
    notes: 'New client, interested in color services',
  },
]

export default function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState<typeof clients[0] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  )

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

        {/* Search */}
        <div className="mt-4">
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients by name, email, or phone..."
              className="block w-full rounded-md border-0 py-1.5 pl-4 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-600 focus:ring-2 focus:ring-inset focus:ring-accent-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Clients List */}
          <div className="space-y-4">
            {filteredClients.map((client) => (
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
                    </div>
                    <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-700">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{client.completedAppointments} completed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        <span>${client.totalSpent}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className="text-sm text-gray-700">
                      Last visit: {new Date(client.lastAppointment).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
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
                    <h3 className="text-sm font-medium text-gray-700">Appointment History</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900">
                          {selectedClient.completedAppointments} of {selectedClient.totalAppointments} appointments completed
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CurrencyDollarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900">Total spent: ${selectedClient.totalSpent}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900">Last appointment: {new Date(selectedClient.lastAppointment).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {selectedClient.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Notes</h3>
                      <div className="mt-2 flex items-start gap-2 text-sm">
                        <ChatBubbleLeftIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-900">{selectedClient.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => {/* TODO: Implement client messaging */}}
                    >
                      Send Message
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {/* TODO: Implement appointment scheduling */}}
                    >
                      Schedule Appointment
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="mt-6 text-center text-gray-500">
                Select a client to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 