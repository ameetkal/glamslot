"use client"

import { motion } from 'framer-motion'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'

// Mock data for the prototype
const appointments = [
  {
    id: 1,
    date: 'Today',
    slots: [
      {
        id: 1,
        clientName: 'Sarah Johnson',
        service: 'Haircut & Color',
        time: '2:00 PM',
        status: 'confirmed' as const,
      },
      {
        id: 2,
        clientName: 'Michael Chen',
        service: 'Haircut Only',
        time: '3:30 PM',
        status: 'confirmed' as const,
      },
      {
        id: 3,
        clientName: 'Emma Davis',
        service: 'Color Service',
        time: '4:45 PM',
        status: 'confirmed' as const,
      },
    ],
  },
  {
    id: 2,
    date: 'Tomorrow',
    slots: [
      {
        id: 4,
        clientName: 'John Smith',
        service: 'Haircut & Styling',
        time: '10:00 AM',
        status: 'confirmed' as const,
      },
      {
        id: 5,
        clientName: 'Lisa Wong',
        service: 'Color Service',
        time: '2:30 PM',
        status: 'confirmed' as const,
      },
    ],
  },
  {
    id: 3,
    date: 'Wednesday',
    slots: [
      {
        id: 6,
        clientName: 'David Kim',
        service: 'Haircut Only',
        time: '11:00 AM',
        status: 'confirmed' as const,
      },
      {
        id: 7,
        clientName: 'Rachel Green',
        service: 'Haircut & Color',
        time: '3:00 PM',
        status: 'confirmed' as const,
      },
    ],
  },
]

export default function AppointmentsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous Week
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                Next Week
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-8 space-y-8">
            {appointments.map((day) => (
              <motion.div
                key={day.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-lg bg-white shadow"
              >
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <h2 className="ml-2 text-lg font-medium text-gray-900">{day.date}</h2>
                  </div>
                </div>
                <ul role="list" className="divide-y divide-gray-200">
                  {day.slots.map((appointment) => (
                    <li key={appointment.id} className="p-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex min-w-0 flex-1 items-center">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {appointment.clientName}
                            </p>
                            <p className="truncate text-sm text-gray-500">{appointment.service}</p>
                          </div>
                        </div>
                        <div className="ml-4 flex flex-shrink-0 items-center space-x-4">
                          <div className="text-sm text-gray-500">{appointment.time}</div>
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            {appointment.status}
                          </span>
                          <button
                            type="button"
                            className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 