'use client'

import { useState } from 'react'
import { GlobeAltIcon, CheckIcon } from '@heroicons/react/24/outline'

interface BookingUrlCardProps {
  bookingUrl?: string
  onCopySuccess?: () => void
  className?: string
}

export default function BookingUrlCard({ 
  bookingUrl, 
  onCopySuccess,
  className = '' 
}: BookingUrlCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!bookingUrl) return

    try {
      await navigator.clipboard.writeText(bookingUrl)
      setCopied(true)
      onCopySuccess?.()
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
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
          <div className="flex rounded-md shadow-sm">
            <input
              type="text"
              readOnly
              value={bookingUrl}
              className="flex-1 rounded-l-md border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              disabled={copied}
              className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4 mr-1 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Share this link with your clients to allow them to request appointments.
          </p>
        </div>
      </div>
    </div>
  )
} 