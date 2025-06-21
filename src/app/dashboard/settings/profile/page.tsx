'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { salonService } from '@/lib/firebase/services'
import { Salon } from '@/types/firebase'
import { 
  UserIcon,
  BuildingStorefrontIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function ProfilePage() {
  const { user } = useAuth()
  const [salon, setSalon] = useState<Salon | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    businessType: 'salon'
  })

  useEffect(() => {
    const fetchSalonData = async () => {
      if (!user) return

      try {
        setLoading(true)
        const salonData = await salonService.getSalon(user.uid)
        
        if (salonData) {
          setSalon(salonData)
          setFormData({
            name: salonData.name || '',
            ownerName: salonData.ownerName || '',
            ownerEmail: salonData.ownerEmail || '',
            ownerPhone: salonData.ownerPhone || '',
            businessType: salonData.businessType || 'salon'
          })
        }
      } catch (error) {
        console.error('Error fetching salon data:', error)
        setError('Failed to load salon information')
      } finally {
        setLoading(false)
      }
    }

    fetchSalonData()
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !salon) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Update salon data
      await salonService.updateSalon(user.uid, {
        name: formData.name,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone,
        businessType: formData.businessType
      })

      // Update local state
      setSalon(prev => prev ? {
        ...prev,
        ...formData
      } : null)

      setSuccess('Profile updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Profile Settings</h1>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XMarkIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* Business Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BuildingStorefrontIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
                      placeholder="Enter business name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
                  >
                    <option value="salon">Salon</option>
                    <option value="spa">Spa</option>
                    <option value="barbershop">Barbershop</option>
                    <option value="independent">Independent Stylist</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Owner Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="ownerName"
                      name="ownerName"
                      required
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
                      placeholder="Enter owner name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="ownerEmail"
                      name="ownerEmail"
                      required
                      value={formData.ownerEmail}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
                      placeholder="Enter owner email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Phone *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="ownerPhone"
                      name="ownerPhone"
                      required
                      value={formData.ownerPhone}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Booking URL Display */}
            {salon && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Booking URL
                      </label>
                      <div className="flex items-center">
                        <GlobeAltIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 font-mono">
                          {salon.bookingUrl}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(salon.bookingUrl)
                        setSuccess('Booking URL copied to clipboard!')
                        setTimeout(() => setSuccess(''), 3000)
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SMS Notification Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">SMS Notifications</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <PhoneIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900">Booking Request Alerts</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      You&apos;ll receive SMS notifications at {formData.ownerPhone || 'your phone number'} when new booking requests are submitted.
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      💡 Make sure your phone number above is correct to receive notifications.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 