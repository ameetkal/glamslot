'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CalendarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import AddSlotForm from '@/components/forms/AddSlotForm'

// Mock data for the prototype
const metrics = [
  { name: 'Open Slots', value: '3', icon: CalendarIcon, change: '+2', changeType: 'positive' },
  { name: 'Pending Requests', value: '5', icon: ClockIcon, change: '+1', changeType: 'negative' },
  { name: 'Total Clients', value: '124', icon: UserGroupIcon, change: '+12', changeType: 'positive' },
  { name: 'Fill Rate', value: '85%', icon: CheckCircleIcon, change: '+5%', changeType: 'positive' },
]

const recentRequests = [
  {
    id: 1,
    clientName: 'Omar Hamoui',
    service: 'Haircut & Color',
    time: 'Today, 2:00 PM',
    status: 'pending',
  },
  {
    id: 2,
    clientName: 'Mike Smith',
    service: 'Beard Trim',
    time: 'Tomorrow, 11:30 AM',
    status: 'approved',
  },
  {
    id: 3,
    clientName: 'Emma Davis',
    service: 'Full Highlights',
    time: 'Tomorrow, 3:00 PM',
    status: 'declined',
  },
]

const availableSlots = [
  { id: 1, date: 'Today', time: '2:00 PM - 3:00 PM', service: 'Any Service' },
  { id: 2, date: 'Tomorrow', time: '11:30 AM - 12:30 PM', service: 'Haircut Only' },
  { id: 3, date: 'Tomorrow', time: '3:00 PM - 4:30 PM', service: 'Color Service' },
]

export default function DashboardPage() {
  const [isAddingSlot, setIsAddingSlot] = useState(false)
  const [slots, setSlots] = useState(availableSlots)

  const handleAddSlot = (data: unknown) => {
    // In a real app, this would make an API call
    const newSlot = {
      id: slots.length + 1,
      date: new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      time: `${data.startTime} - ${data.endTime}`,
      service: data.serviceType === 'any' ? 'Any Service' : 
               data.serviceType === 'haircut' ? 'Haircut Only' :
               data.serviceType === 'color' ? 'Color Service' : 'Styling Only',
    }
    setSlots([...slots, newSlot])
    setIsAddingSlot(false)
  }

  const handleRemoveSlot = (id: number) => {
    setSlots(slots.filter(slot => slot.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Metrics */}
          <div className="mt-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
                >
                  <dt>
                    <div className="absolute rounded-md bg-accent-50 p-3">
                      <metric.icon className="h-6 w-6 text-accent-600" aria-hidden="true" />
                    </div>
                    <p className="ml-16 truncate text-sm font-medium text-gray-500">{metric.name}</p>
                  </dt>
                  <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                    <p
                      className={`ml-2 flex items-baseline text-sm font-semibold ${
                        metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {metric.change}
                    </p>
                  </dd>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Available Slots */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-lg bg-white shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold leading-6 text-gray-900">Available Slots</h2>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingSlot(true)}
                    className="flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Slot
                  </Button>
                </div>
                <div className="mt-6 flow-root">
                  <ul role="list" className="-my-5 divide-y divide-gray-200">
                    {slots.map((slot) => (
                      <li key={slot.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{slot.date}</p>
                            <p className="truncate text-sm text-gray-500">{slot.time}</p>
                          </div>
                          <div>
                            <span className="inline-flex items-center rounded-full bg-tan-50 px-2 py-1 text-xs font-medium text-tan-700 ring-1 ring-inset ring-tan-600/20">
                              {slot.service}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(slot.id)}
                            className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Recent Requests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="overflow-hidden rounded-lg bg-white shadow"
            >
              <div className="p-6">
                <h2 className="text-base font-semibold leading-6 text-gray-900">Recent Requests</h2>
                <div className="mt-6 flow-root">
                  <ul role="list" className="-my-5 divide-y divide-gray-200">
                    {recentRequests.map((request) => (
                      <li key={request.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{request.clientName}</p>
                            <p className="truncate text-sm text-gray-500">{request.service}</p>
                            <p className="truncate text-sm text-gray-500">{request.time}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {request.status === 'pending' && (
                              <>
                                <Button size="sm" variant="primary">
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline">
                                  Decline
                                </Button>
                              </>
                            )}
                            {request.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                <CheckCircleIcon className="h-4 w-4" />
                                Approved
                              </span>
                            )}
                            {request.status === 'declined' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                                <XCircleIcon className="h-4 w-4" />
                                Declined
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Add Slot Modal */}
      <Modal
        isOpen={isAddingSlot}
        onClose={() => setIsAddingSlot(false)}
        title="Add Available Slot"
      >
        <AddSlotForm
          onSubmit={handleAddSlot}
          onCancel={() => setIsAddingSlot(false)}
        />
      </Modal>
    </div>
  )
} 