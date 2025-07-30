'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { salonService, teamService } from '@/lib/firebase/services'
import { Salon } from '@/types/firebase'
import BookingUrlCard from '@/components/ui/BookingUrlCard'

export default function LinksPage() {
  const { user } = useAuth()
  const [salonData, setSalonData] = useState<Salon | null>(null)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchSalonData = async () => {
      if (!user) return

      try {
        setLoading(true)
        
        // First, check if user is a team member
        const userTeamMember = await teamService.getTeamMemberByUserId(user.uid)
        let salonId = user.uid // Default to user.uid for salon owners
        
        if (userTeamMember) {
          // User is a team member, use their salonId
          salonId = userTeamMember.salonId
        }

        // Fetch salon data using the correct salon ID
        const salonData = await salonService.getSalon(salonId)
        if (salonData) {
          setSalonData(salonData)
        }
      } catch (error: unknown) {
        console.error('Error fetching salon data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSalonData()
  }, [user])

  const handleCopySuccess = () => {
    setSuccess('Booking URL copied to clipboard!')
    setTimeout(() => setSuccess(''), 3000)
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

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Links</h1>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Booking URL Card */}
          <BookingUrlCard 
            bookingUrl={salonData?.bookingUrl}
            onCopySuccess={handleCopySuccess}
          />
          
          {/* Future link cards can be added here */}
          {/* Example:
          <SocialMediaCard />
          <WebsiteCard />
          */}
        </div>
      </div>
    </div>
  )
} 