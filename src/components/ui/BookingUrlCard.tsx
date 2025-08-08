'use client'

import { GlobeAltIcon } from '@heroicons/react/24/outline'

interface BookingUrlCardProps {
  bookingUrl?: string
  className?: string
}

export default function BookingUrlCard({ bookingUrl, className = '' }: BookingUrlCardProps) {
  const handleVisit = () => {
    if (bookingUrl) {
      window.open(bookingUrl, '_blank')
    }
  }

  if (!bookingUrl) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Booking URL</h3>
        <div className="text-sm text-gray-500">Loading booking URL...</div>
      </div>
    )
  }

  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Booking URL</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Public Booking Link
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={bookingUrl}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
            />
            <button
              type="button"
              onClick={handleVisit}
              className="inline-flex items-center px-3 py-2 border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors rounded-md"
            >
              <GlobeAltIcon className="h-4 w-4 mr-1" />
              Visit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 