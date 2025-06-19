"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline'

// Mock data for the prototype
const metrics = [
  { 
    name: 'Pending Requests', 
    value: '5', 
    icon: ClockIcon,
    href: '/dashboard/requests',
    change: '+2',
    changeType: 'increase' as const
  },
  { 
    name: 'Appointments Today', 
    value: '5', 
    icon: CalendarIcon,
    href: '/dashboard/appointments',
    change: '-2',
    changeType: 'decrease' as const
  },
  { 
    name: 'Total Clients', 
    value: '24', 
    icon: UserGroupIcon,
    href: '/dashboard/clients',
    change: '+12%',
    changeType: 'increase' as const
  },
  { 
    name: 'Total Revenue', 
    value: '$2,400', 
    icon: CurrencyDollarIcon,
    href: '/dashboard/revenue',
    change: '+8%',
    changeType: 'increase' as const
  },
]

const recentAppointments = [
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
]

export default function DashboardPage() {
  const [copied, setCopied] = useState(false)
  const bookingUrl = "https://last-minute-app.vercel.app/booking/test"

  const copyBookingUrl = () => {
    navigator.clipboard.writeText(bookingUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

          {/* Booking URL Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 rounded-lg bg-white p-4 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900">Your Booking URL</h2>
            <p className="mt-1 text-sm text-gray-500">
              Share this link with your clients so they can request appointments
            </p>
            <div className="mt-2 flex items-center">
              <input
                readOnly
                value={bookingUrl}
                className="flex-1 rounded-l-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
              />
              <button
                onClick={copyBookingUrl}
                className="inline-flex items-center justify-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
                aria-label="Copy booking URL"
              >
                <ClipboardDocumentIcon className="h-5 w-5" />
              </button>
            </div>
            {copied && (
              <p className="mt-1 text-xs text-green-600">Copied to clipboard!</p>
            )}
          </motion.div>

          {/* Metrics */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Link
                  href={metric.href}
                  className="block overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <metric.icon className="h-6 w-6 text-accent-600" aria-hidden="true" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="truncate text-sm font-medium text-gray-500">{metric.name}</dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">{metric.value}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className={`inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium ${
                        metric.changeType === 'increase' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {metric.change}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Recent Appointments */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Today&apos;s Appointments</h2>
              <Link
                href="/dashboard/appointments"
                className="text-sm font-medium text-accent-600 hover:text-accent-500"
              >
                View all
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mt-4 overflow-hidden rounded-lg bg-white shadow"
            >
              <ul role="list" className="divide-y divide-gray-200">
                {recentAppointments.map((appointment) => (
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
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
} 