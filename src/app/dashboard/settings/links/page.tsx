'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useSalonContext } from '@/lib/hooks/useSalonContext'
import { salonService } from '@/lib/firebase/services'
import GlampageCard from '@/components/ui/GlampageCard'
import { Salon } from '@/types/firebase'

export default function LinksPage() {
  const { user } = useAuth()
  const { salonId: contextSalonId, salonName, isImpersonating } = useSalonContext()
  const [salonData, setSalonData] = useState<Salon | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    if (hasFetched) {
      return
    }

    const fetchSalonData = async () => {
      if (!user || !contextSalonId) return

      try {
        setLoading(true)
        
        // Fetch salon data
        const salon = await salonService.getSalon(contextSalonId)
        
        if (salon) {
          setSalonData(salon)
        } else {
          // Create fallback data if salon doesn't exist
          const fallbackData: Salon = {
            id: contextSalonId,
            name: salonName || 'Business',
            slug: 'business',
            bookingUrl: `https://glamslot.vercel.app/booking/business`,
            externalLinks: {},
            settings: {
              notifications: {
                email: false,
                sms: false,
                bookingConfirmation: false,
                bookingReminders: false
              },
              businessHours: {
                monday: { isOpen: false },
                tuesday: { isOpen: false },
                wednesday: { isOpen: false },
                thursday: { isOpen: false },
                friday: { isOpen: false },
                saturday: { isOpen: false },
                sunday: { isOpen: false }
              },
              booking: {
                requireConsultation: false,
                allowWaitlist: true
              }
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
          setSalonData(fallbackData)
        }
        
        setHasFetched(true)
      } catch (error) {
        console.error('Error fetching salon data:', error)
        
        // Create error fallback data
        const errorFallbackData: Salon = {
          id: contextSalonId,
          name: salonName || 'Business',
          slug: 'business',
          bookingUrl: `https://glamslot.vercel.app/booking/business`,
          externalLinks: {},
          settings: {
            notifications: {
              email: false,
              sms: false,
              bookingConfirmation: false,
              bookingReminders: false
            },
            businessHours: {
              monday: { isOpen: false },
              tuesday: { isOpen: false },
              wednesday: { isOpen: false },
              thursday: { isOpen: false },
              friday: { isOpen: false },
              saturday: { isOpen: false },
              sunday: { isOpen: false }
            },
            booking: {
              requireConsultation: false,
              allowWaitlist: true
            }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
        setSalonData(errorFallbackData)
        setHasFetched(true)
      } finally {
        setLoading(false)
      }
    }

    fetchSalonData()
  }, [user, contextSalonId, salonName, hasFetched])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your business links...</p>
        </div>
      </div>
    )
  }

  if (!salonData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load business data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* SuperAdmin Context Indicator */}
      {isImpersonating && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 font-medium">
            👁️ Viewing as SuperAdmin: {salonName}
          </p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Links</h1>
        <p className="text-gray-600">
          Share these links with your clients to help them connect with your business.
        </p>
      </div>

      {/* Glampage Card - Full Width */}
      <div className="mb-8">
        <GlampageCard
          glampageUrl={salonData.externalLinks?.glampage}
          salonData={salonData}
          onSalonUpdate={(updatedSalon) => setSalonData(updatedSalon)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Booking Link */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Appointment Booking</h3>
              <p className="text-sm text-gray-500">Direct booking link</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded border">
              <p className="text-sm text-gray-600 break-all">{salonData.bookingUrl}</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(salonData.bookingUrl)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Copy Link
            </button>
          </div>
        </div>

        {/* Virtual Consultation Link */}
        {salonData.externalLinks?.virtualConsultation && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z" />
                </svg>
            </div>
              <div>
                <h3 className="font-semibold text-gray-900">Virtual Consultation</h3>
                <p className="text-sm text-gray-500">Online consultation form</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded border">
                <p className="text-sm text-gray-600 break-all">{salonData.externalLinks.virtualConsultation}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(salonData.externalLinks!.virtualConsultation!)}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Copy Link
            </button>
            </div>
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="mt-12 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Use These Links</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">For Clients</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Share the booking link for direct appointments</li>
              <li>• Use the consultation link for virtual meetings</li>
              <li>• Include shop link in your marketing materials</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">For Your Business</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Add links to your social media profiles</li>
              <li>• Include in email signatures</li>
              <li>• Print on business cards and flyers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 