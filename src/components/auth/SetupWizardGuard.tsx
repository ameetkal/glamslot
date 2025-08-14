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
  const [redirectAttempts, setRedirectAttempts] = useState(0)

  useEffect(() => {
    const checkSetupStatus = async () => {
      if (!user || loading || checkingSetup) return

      // Prevent multiple rapid checks
      if (checkingSetup) return

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
          // Prevent infinite redirects
          if (redirectAttempts >= 3) {
            console.error('🔍 Too many redirect attempts, allowing access to prevent infinite loop')
            return
          }

          // Incomplete setup, redirect to setup wizard
          console.log('🔍 Setup incomplete, redirecting to wizard (attempt', redirectAttempts + 1, '):', {
            hasOwnerName: !!salonData.ownerName,
            hasBusinessType: !!salonData.businessType,
            hasExternalLinks: !!salonData.externalLinks,
            salonData: salonData
          })
          
          setRedirectAttempts(prev => prev + 1)
          
          // Add a small delay to prevent rapid redirects
          setTimeout(() => {
            router.push('/setup-wizard')
          }, 100)
          return
        }

        console.log('🔍 Setup complete, allowing access to dashboard')
        console.log('📍 Guard current URL:', typeof window !== 'undefined' ? window.location.pathname : 'SSR')
        console.log('🛡️ SetupWizardGuard check at:', new Date().toISOString())
        // Reset redirect attempts when setup is complete
        setRedirectAttempts(0)

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
  }, [user, loading, router])

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
