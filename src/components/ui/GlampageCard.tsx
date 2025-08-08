'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { Salon } from '@/types/firebase'
import { salonService } from '@/lib/firebase/services'

interface GlampageCardProps {
  glampageUrl?: string
  className?: string
  salonData?: Salon | null
  onSalonUpdate?: (updatedSalon: Salon) => void
}

export default function GlampageCard({ 
  glampageUrl, 
  className = '',
  salonData,
  onSalonUpdate
}: GlampageCardProps) {
  const [showExternalLinks, setShowExternalLinks] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [externalLinks, setExternalLinks] = useState({
    bookNow: salonData?.externalLinks?.bookNow || salonData?.bookingUrl || '',
    shop: salonData?.externalLinks?.shop || '',
    instagram: salonData?.externalLinks?.instagram || '',
    facebook: salonData?.externalLinks?.facebook || ''
  })

  const handleVisit = () => {
    if (glampageUrl) {
      window.open(glampageUrl, '_blank')
    }
  }

  const handleInputChange = (field: keyof typeof externalLinks, value: string) => {
    setExternalLinks(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true // Empty URLs are valid
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSaveExternalLinks = async () => {
    if (!salonData?.id) return

    // Validate URLs
    const invalidUrls = Object.entries(externalLinks)
      .filter(([, url]) => url.trim() && !validateUrl(url))
      .map(([field]) => field)

    if (invalidUrls.length > 0) {
      alert(`Invalid URLs: ${invalidUrls.join(', ')}`)
      return
    }

    setSaving(true)
    try {
      await salonService.updateExternalLinks(salonData.id, externalLinks)
      
      // Update local salon data
      if (onSalonUpdate && salonData) {
        onSalonUpdate({
          ...salonData,
          externalLinks
        })
      }
      
      // Show save success message
      setSuccess('External links saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error saving external links:', error)
      alert('Failed to save external links')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Glampage</h3>
      </div>

      {/* Glampage URL */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Public Glampage URL
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={glampageUrl || 'Loading Glampage URL...'}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
          />
          <button
            onClick={handleVisit}
            disabled={!glampageUrl}
            className="inline-flex items-center px-3 py-2 border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md"
          >
            <GlobeAltIcon className="w-4 h-4 mr-1" />
            Visit
          </button>
        </div>
      </div>

      {/* Customize External Links Button */}
      <div className="mb-4">
        <button
          onClick={() => setShowExternalLinks(!showExternalLinks)}
          className="flex items-center text-sm text-accent-600 hover:text-accent-700 font-medium"
        >
          Customize External Links
          {showExternalLinks ? (
            <ChevronUpIcon className="w-4 h-4 ml-1" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 ml-1" />
          )}
        </button>
      </div>

      {/* External Links Section */}
      {showExternalLinks && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <h4 className="text-sm font-medium text-gray-900">External Links</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Book Now URL
            </label>
            <input
              type="url"
              value={externalLinks.bookNow}
              onChange={(e) => handleInputChange('bookNow', e.target.value)}
              placeholder="https://your-booking-system.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use the default Glamslot booking system
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop URL
            </label>
            <input
              type="url"
              value={externalLinks.shop}
              onChange={(e) => handleInputChange('shop', e.target.value)}
              placeholder="https://your-shop.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instagram URL
            </label>
            <input
              type="url"
              value={externalLinks.instagram}
              onChange={(e) => handleInputChange('instagram', e.target.value)}
              placeholder="https://instagram.com/your-handle"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facebook URL
            </label>
            <input
              type="url"
              value={externalLinks.facebook}
              onChange={(e) => handleInputChange('facebook', e.target.value)}
              placeholder="https://facebook.com/your-page"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
            <div className="flex space-x-3">
              <button
                onClick={() => setShowExternalLinks(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExternalLinks}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 