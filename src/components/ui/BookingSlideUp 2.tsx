'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface BookingSlideUpProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; phone: string; optInCommunications: boolean }) => void
  loading?: boolean
}

export default function BookingSlideUp({ isOpen, onClose, onSubmit, loading = false }: BookingSlideUpProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    optInCommunications: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim() && formData.phone.trim()) {
      onSubmit(formData)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Slide-up Panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 transform transition-transform duration-300 ease-out">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        
        {/* Content */}
        <div className="px-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                placeholder="Your full name"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="optInCommunications"
                name="optInCommunications"
                checked={formData.optInCommunications}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
              />
              <label htmlFor="optInCommunications" className="text-sm text-gray-700">
                I agree to receive communications from this business
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.phone.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Continue to Booking'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
} 