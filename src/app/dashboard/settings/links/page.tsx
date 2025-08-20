'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useSalonContext } from '@/lib/hooks/useSalonContext'
import { salonService } from '@/lib/firebase/services'
import GlampageCard from '@/components/ui/GlampageCard'
import VirtualConsultationCard from '@/components/ui/VirtualConsultationCard'
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

      {/* Virtual Consultation Card - Full Width */}
      <div className="mb-8">
        <VirtualConsultationCard
          consultationUrl={`https://glamslot.vercel.app/consultation/${salonData.slug}`}
          salonData={salonData}
          onSalonUpdate={(updatedSalon) => setSalonData(updatedSalon)}
        />
      </div>

      {/* Appointment Booking Card - Full Width */}
      <div className="mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Appointment Booking Request URL</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="text"
              readOnly
              value={salonData.bookingUrl}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
            />
            <a
              href={salonData.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors rounded-md whitespace-nowrap"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Visit
            </a>
          </div>
        </div>
      </div>

      {/* Glampage Card - Full Width */}
      <div className="mb-8">
        <GlampageCard
          glampageUrl={salonData.externalLinks?.glampage}
          salonData={salonData}
          onSalonUpdate={(updatedSalon) => setSalonData(updatedSalon)}
        />
      </div>


    </div>
  )
} 