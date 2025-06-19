"use client"

import { CalendarIcon, UserGroupIcon, ClockIcon, XMarkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useState } from 'react'

// Mock data for dashboard metrics
const dashboardStats = {
  appointmentsCreated: 47,
  requestedNotFulfilled: 12,
  totalClients: 156,
  averageResponseTime: '2.3 hours'
}

const recentActivity = [
  {
    id: 1,
    type: 'booking_request',
    message: 'New booking request from Sarah Johnson',
    time: '2 minutes ago',
    status: 'pending'
  },
  {
    id: 2,
    type: 'appointment_booked',
    message: 'Appointment booked for Mike Chen',
    time: '15 minutes ago',
    status: 'completed'
  },
  {
    id: 3,
    type: 'appointment_not_booked',
    message: 'Appointment not booked for Emily Rodriguez',
    time: '1 hour ago',
    status: 'completed'
  },
  {
    id: 4,
    type: 'booking_request',
    message: 'New booking request from David Kim',
    time: '2 hours ago',
    status: 'pending'
  }
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
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-700 mb-4">
              Overview of your salon&apos;s booking activity and performance
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <div className="flex rounded-md shadow-sm">
              <input
                type="text"
                placeholder="Search..."
                className="block w-full rounded-l-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-accent-600 sm:text-sm sm:leading-6"
              />
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Booking URL Section */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Booking URL</h2>
          <p className="text-sm text-gray-600 mb-4">
            Share this link with your clients so they can request appointments
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={bookingUrl}
              className="flex-1 rounded-l-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none"
            />
            <button
              onClick={copyBookingUrl}
              className="inline-flex items-center justify-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors"
              aria-label="Copy booking URL"
            >
              <ClipboardDocumentIcon className="h-5 w-5" />
            </button>
          </div>
          {copied && (
            <p className="mt-2 text-sm text-green-600">✓ Copied to clipboard!</p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">
                      Appointments Created
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardStats.appointmentsCreated}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XMarkIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">
                      Requested but not Fulfilled
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardStats.requestedNotFulfilled}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">
                      Total Clients
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardStats.totalClients}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-700 truncate">
                      Avg Response Time
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardStats.averageResponseTime}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/dashboard/requests"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-accent-500 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-accent-50 text-accent-700 ring-4 ring-white">
                  <CalendarIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Review Booking Requests
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Check and respond to new booking requests from clients
                </p>
              </div>
              <span
                className="pointer-events-none absolute top-6 right-6 text-gray-400 group-hover:text-gray-500"
                aria-hidden="true"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                </svg>
              </span>
            </Link>

            <Link
              href="/dashboard/settings/providers"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-accent-500 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                  <UserGroupIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Manage Providers
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Update provider information, services, and availability
                </p>
              </div>
              <span
                className="pointer-events-none absolute top-6 right-6 text-gray-400 group-hover:text-gray-500"
                aria-hidden="true"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                </svg>
              </span>
            </Link>

            <Link
              href="/dashboard/settings/availability"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-accent-500 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  <ClockIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Set Availability
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Configure business hours and provider schedules
                </p>
              </div>
              <span
                className="pointer-events-none absolute top-6 right-6 text-gray-400 group-hover:text-gray-500"
                aria-hidden="true"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                </svg>
              </span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <li key={activity.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {activity.type === 'booking_request' && (
                            <CalendarIcon className="h-5 w-5 text-blue-500" />
                          )}
                          {activity.type === 'appointment_booked' && (
                            <CalendarIcon className="h-5 w-5 text-green-500" />
                          )}
                          {activity.type === 'appointment_not_booked' && (
                            <XMarkIcon className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.message}
                          </p>
                          <p className="text-sm text-gray-600">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {activity.status === 'pending' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                        {activity.status === 'completed' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 