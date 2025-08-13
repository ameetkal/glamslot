'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { salonService } from '@/lib/firebase/services'

interface SetupWizardGuardProps {
  children: React.ReactNode
}

export function SetupWizardGuard({ children }: SetupWizardGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkingSetup, setCheckingSetup] = useState(false)

  useEffect(() => {
    const checkSetupStatus = async () => {
      if (!user || loading || checkingSetup) return

      setCheckingSetup(true)
      
      try {
        // Check if user has a salon document
        const salonData = await salonService.getSalon(user.uid)
        
        if (!salonData) {
          // No salon document, redirect to setup wizard
          router.push('/setup-wizard')
          return
        }

        // Check if user has completed basic setup (has owner name and business type)
        const hasCompletedSetup = salonData.ownerName && 
          salonData.businessType && 
          salonData.externalLinks

        if (!hasCompletedSetup) {
          // Incomplete setup, redirect to setup wizard
          router.push('/setup-wizard')
          return
        }

        // Setup is complete, user can access dashboard
      } catch (error) {
        console.error('Error checking setup status:', error)
        // If there's an error, assume setup is incomplete
        router.push('/setup-wizard')
      } finally {
        setCheckingSetup(false)
      }
    }

    checkSetupStatus()
  }, [user, loading, router, checkingSetup])

  // Show loading while checking setup status
  if (loading || checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up your account...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
