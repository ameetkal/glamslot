'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useSalonContext } from '@/lib/hooks/useSalonContext'
import { salonService, teamService } from '@/lib/firebase/services'
import { Salon } from '@/types/firebase'
import BookingUrlCard from '@/components/ui/BookingUrlCard'
import GlampageCard from '@/components/ui/GlampageCard'
import VirtualConsultationCard from '@/components/ui/VirtualConsultationCard'

// Helper function to generate a slug from a business name
const generateSlug = (businessName: string): string => {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

export default function LinksPage() {
  const { user } = useAuth()
  const { salonId: contextSalonId, salonName, isImpersonating } = useSalonContext()
  const [salonData, setSalonData] = useState<Salon | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSalonData = async () => {
      if (!user || !contextSalonId) {
        console.log('❌ No user or contextSalonId found')
        return
      }

      try {
        setLoading(true)
        
        // For SuperAdmin context switching, use the selected salon ID
        // For regular users, determine their salon ID
        let salonId = contextSalonId;
        
        if (!isImpersonating) {
          // Regular user: check if they're a team member
          const userTeamMember = await teamService.getTeamMemberByUserId(user.uid)
          
          if (userTeamMember) {
            // User is a team member, use their salonId
            salonId = userTeamMember.salonId
            console.log('👥 User is a team member, using salonId:', salonId)
          } else {
            // User is a salon owner, use their own ID
            salonId = user.uid
            console.log('👤 User is a salon owner, using salonId:', salonId)
          }
        } else {
          console.log('👑 SuperAdmin impersonating salon:', salonId)
        }

        console.log('🔍 Fetching salon data for salonId:', salonId)

        // Fetch salon data using the correct salon ID
        const salonData = await salonService.getSalon(salonId)
        if (salonData) {
          console.log('✅ Salon data fetched:', {
            id: salonData.id,
            name: salonData.name,
            slug: salonData.slug,
            bookingUrl: salonData.bookingUrl
          })
          
          // Ensure we have the required fields with fallbacks
          const businessName = salonData.name || 'My Salon'
          const businessSlug = salonData.slug || generateSlug(businessName)
          const enhancedSalonData = {
            ...salonData,
            name: businessName,
            slug: businessSlug,
            bookingUrl: salonData.bookingUrl || `https://glamslot.vercel.app/booking/${businessSlug}`
          }
          
          console.log('🎯 Enhanced salon data:', enhancedSalonData)
          setSalonData(enhancedSalonData)
        } else {
          console.log('❌ No salon data found for salonId:', salonId)
          // Create a fallback salon data object with a proper slug
          const fallbackName = 'My Salon'
          const fallbackSlug = generateSlug(fallbackName)
          const fallbackSalonData: Salon = {
            id: salonId,
            name: fallbackName,
            slug: fallbackSlug,
            bookingUrl: `https://glamslot.vercel.app/booking/${fallbackSlug}`,
            settings: {
              notifications: { 
                email: true, 
                sms: false, 
                bookingConfirmation: true, 
                bookingReminders: true 
              },
              booking: { requireConsultation: false, allowWaitlist: true },
              businessHours: {
                monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
                tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
                wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
                thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
                friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
                saturday: { isOpen: true, openTime: '10:00', closeTime: '15:00' },
                sunday: { isOpen: false }
              }
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
          console.log('🔄 Using fallback salon data:', fallbackSalonData)
          setSalonData(fallbackSalonData)
        }
      } catch (error: unknown) {
        console.error('Error fetching salon data:', error)
        // Create a fallback salon data object on error
        const fallbackName = 'My Salon'
        const fallbackSlug = generateSlug(fallbackName)
        const fallbackSalonData: Salon = {
          id: user.uid,
          name: fallbackName,
          slug: fallbackSlug,
          bookingUrl: `https://glamslot.vercel.app/booking/${fallbackSlug}`,
          settings: {
            notifications: { 
              email: true, 
              sms: false, 
              bookingConfirmation: true, 
              bookingReminders: true 
            },
            booking: { requireConsultation: false, allowWaitlist: true },
            businessHours: {
              monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
              saturday: { isOpen: true, openTime: '10:00', closeTime: '15:00' },
              sunday: { isOpen: false }
            }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
        console.log('🔄 Using fallback salon data due to error:', fallbackSalonData)
        setSalonData(fallbackSalonData)
      } finally {
        setLoading(false)
      }
    }

    fetchSalonData()
  }, [user, contextSalonId, isImpersonating])

  // Generate Glampage URL
  const getGlampageUrl = () => {
    if (!salonData?.slug) {
      console.log('❌ No slug found for salon:', salonData?.name)
      return undefined
    }
    
    // Use the current origin for localhost, or the production URL
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://glamslot.vercel.app'
    
    const glampageUrl = `${baseUrl}/glampage/${salonData.slug}`
    console.log('🔗 Generated Glampage URL:', glampageUrl)
    return glampageUrl
  }

  // Generate Virtual Consultation URL
  const getConsultationUrl = () => {
    if (!salonData?.slug) {
      console.log('❌ No slug found for salon:', salonData?.name)
      return undefined
    }
    
    // Use the current origin for localhost, or the production URL
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://glamslot.vercel.app'
    
    const consultationUrl = `${baseUrl}/consultation/${salonData.slug}`
    console.log('🔗 Generated Consultation URL:', consultationUrl)
    return consultationUrl
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading links...</p>
          </div>
        </div>
      </div>
    )
  }

  console.log('🎯 Rendering Links page with salonData:', {
    name: salonData?.name,
    slug: salonData?.slug,
    bookingUrl: salonData?.bookingUrl,
    consultationUrl: getConsultationUrl(),
    glampageUrl: getGlampageUrl()
  })

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Links</h1>
          {isImpersonating && (
            <div className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              <span>👁️ Viewing as SuperAdmin: {salonName}</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Booking URL Card */}
          <BookingUrlCard 
            bookingUrl={salonData?.bookingUrl}
            className=""
          />
          
          {/* Virtual Consultation Card */}
          <VirtualConsultationCard 
            consultationUrl={getConsultationUrl()}
            salonData={salonData}
            onSalonUpdate={(updatedSalon) => setSalonData(updatedSalon)}
            className=""
          />
          
          {/* Glampage Card */}
          <GlampageCard 
            glampageUrl={getGlampageUrl()}
            salonData={salonData}
            onSalonUpdate={(updatedSalon) => setSalonData(updatedSalon)}
          />
        </div>
      </div>
    </div>
  )
} 