'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useSalonContext } from '@/lib/hooks/useSalonContext'
import { salonService } from '@/lib/firebase/services'
import { UsageTracker } from '@/lib/usageTracker'
import { CreditCardIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Salon } from '@/types/firebase'
import { useSearchParams } from 'next/navigation'

// Import types only, not the service that requires server-side Stripe
interface BillingSummary {
  salonId: string
  usage: {
    totalRequests: number
    bookingCount: number
    consultationCount: number
    lastUpdated: Date | { toDate: () => Date } // Allow Firestore Timestamp or Date
  }
  billingAccount?: {
    id: string
    salonId: string
    stripeCustomerId: string
    subscriptionId: string
    status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'paused' | 'trialing' | 'unpaid'
    billingEmail: string
    createdAt: Date
    updatedAt: Date
  }
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  nextBillingDate?: Date
}

export default function BillingPage() {
  const { user } = useAuth()
  const { salonId: contextSalonId, salonName, isImpersonating } = useSalonContext()
  const searchParams = useSearchParams()
  const [salon, setSalon] = useState<Salon | null>(null)
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settingUpBilling, setSettingUpBilling] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    console.log('Billing page useEffect - user:', user?.uid, 'contextSalonId:', contextSalonId)
    if (user?.uid && contextSalonId) {
      loadSalonData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid, contextSalonId])
  
  // Effect to handle Stripe checkout success/cancel
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    const sessionId = searchParams.get('session_id')
    
    if (success === 'true' && sessionId) {
      setSuccessMessage('🎉 Billing setup successful! Your subscription is now active.')
      // Clear the success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
      
      // Reload billing summary to show updated status
      if (salon?.id) {
        loadBillingSummary()
      }
    } else if (canceled === 'true') {
      setError('Billing setup was canceled. You can try again anytime.')
      // Clear the error after 5 seconds
      setTimeout(() => setError(null), 5000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, salon?.id])
  
  const loadSalonData = async () => {
    if (!user?.uid || !contextSalonId) return
    
    try {
      setLoading(true)
      console.log('🔍 Loading salon data for salon:', contextSalonId)
      const salonData = await salonService.getSalon(contextSalonId)
      console.log('✅ Salon data loaded:', salonData)
      setSalon(salonData)
    } catch (err) {
      console.error('Error loading salon data:', err)
      setError('Failed to load salon information')
    } finally {
      setLoading(false)
    }
  }

  const loadBillingSummary = async () => {
    console.log('loadBillingSummary called with salon ID:', salon?.id)
    if (!salon?.id) return
    
    try {
      console.log('Loading usage summary...')
      
      // Get usage data
      let usage;
      try {
        usage = await UsageTracker.getUsageSummary(salon.id)
        console.log('Usage summary loaded:', usage)
      } catch (usageError) {
        console.log('Usage tracking not available yet, using mock data:', usageError)
        // Create mock usage data for testing
        usage = {
          salonId: salon.id,
          totalRequests: 0,
          bookingCount: 0,
          consultationCount: 0,
          lastUpdated: new Date()
        }
      }
      
      // Check for existing billing account
      let billingAccount = undefined;
      try {
        const { collection, query, where, getDocs, limit } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        
        const billingRef = collection(db, 'billing_accounts')
        const q = query(billingRef, where('salonId', '==', salon.id), limit(1))
        const snapshot = await getDocs(q)
        
        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          const data = doc.data()
          billingAccount = {
            id: doc.id,
            salonId: data.salonId,
            stripeCustomerId: data.stripeCustomerId,
            subscriptionId: data.subscriptionId,
            status: data.status,
            billingEmail: data.billingEmail,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          }
          console.log('✅ Found existing billing account:', billingAccount)
        } else {
          console.log('ℹ️ No existing billing account found')
        }
      } catch (billingError) {
        console.log('Could not check for billing account:', billingError)
      }
      
      // Calculate billing period information if billing account exists
      let currentPeriodStart: Date | undefined
      let currentPeriodEnd: Date | undefined
      let nextBillingDate: Date | undefined
      
      if (billingAccount && billingAccount.status === 'active') {
        try {
          // For now, estimate billing periods (monthly from creation date)
          // In production, you'd get this from Stripe subscription details
          const createdAt = billingAccount.createdAt instanceof Date ? 
            billingAccount.createdAt : 
            billingAccount.createdAt.toDate()
          
          const now = new Date()
          const monthsSinceCreation = (now.getFullYear() - createdAt.getFullYear()) * 12 + 
            (now.getMonth() - createdAt.getMonth())
          
          // Calculate current period (monthly billing)
          const periodStart = new Date(createdAt)
          periodStart.setMonth(createdAt.getMonth() + monthsSinceCreation)
          
          const periodEnd = new Date(periodStart)
          periodEnd.setMonth(periodStart.getMonth() + 1)
          
          currentPeriodStart = periodStart
          currentPeriodEnd = periodEnd
          nextBillingDate = periodEnd
          
          console.log('📅 Billing period calculated:', {
            start: currentPeriodStart.toISOString(),
            end: currentPeriodEnd.toISOString(),
            next: nextBillingDate.toISOString()
          })
        } catch (periodError) {
          console.log('Could not calculate billing period:', periodError)
        }
      }
      
      // Create billing summary with real data
      const summary: BillingSummary = {
        salonId: salon.id,
        usage,
        billingAccount,
        currentPeriodStart,
        currentPeriodEnd,
        nextBillingDate
      }
      
      console.log('Setting billing summary:', summary)
      setBillingSummary(summary)
    } catch (err) {
      console.error('Error in loadBillingSummary:', err)
      setError('Failed to load usage information')
    }
  }

  // Load billing summary when salon data is available
  useEffect(() => {
    if (salon?.id) {
      console.log('Salon data available, loading billing summary')
      loadBillingSummary()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon?.id])
  
  const handleSetupBilling = async () => {
    if (!salon?.id || !user?.email) {
      setError('Missing salon or user information')
      return
    }
    
    setSettingUpBilling(true)
    try {
      console.log('🚀 Starting Stripe checkout setup...')
      
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salonId: salon.id,
          email: user.email,
          name: salon.name,
          phone: '', // Phone not available on salon object
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }
      
      const { checkoutUrl } = await response.json()
      console.log('✅ Checkout session created, redirecting to:', checkoutUrl)
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl
      
    } catch (error) {
      console.error('❌ Error setting up billing:', error)
      setError(error instanceof Error ? error.message : 'Failed to set up billing')
    } finally {
      setSettingUpBilling(false)
    }
  }

  const handleCancelBilling = async () => {
    if (!billingSummary?.billingAccount?.id) return
    
    if (!confirm('Are you sure you want to cancel your billing account? This will stop all billing immediately.')) {
      return
    }
    
    try {
      // For now, just show a message since BillingService requires server-side Stripe
      alert('Billing cancellation will be implemented when we add the full Stripe integration.')
      
      // TODO: Implement actual billing cancellation
      // const success = await BillingService.cancelBillingAccount(billingSummary.billingAccount.id)
      // if (success) {
      //   await loadBillingSummary()
      // } else {
      //   setError('Failed to cancel billing account')
      // }
    } catch (err) {
      setError('Failed to cancel billing account')
      console.error('Error canceling billing account:', err)
    }
  }

  if (!salon || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="mt-4 text-center text-gray-600">
            {!salon ? 'Loading salon information...' : 'Loading billing information...'}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={loadBillingSummary}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Usage</h1>
          <p className="text-gray-600 mt-2">
            Manage your billing account and view usage statistics
          </p>
          {isImpersonating && (
            <div className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              <span>👁️ Viewing as SuperAdmin: {salonName}</span>
            </div>
          )}
          
          {/* Success Message */}
          {successMessage && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-800">{successMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* Usage Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Usage Overview
            </h2>
            <button
              onClick={loadBillingSummary}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Refresh
            </button>
          </div>
          
          {billingSummary?.usage ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {billingSummary.usage.totalRequests}
                </div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {billingSummary.usage.bookingCount}
                </div>
                <div className="text-sm text-gray-600">Booking Requests</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {billingSummary.usage.consultationCount}
                </div>
                <div className="text-sm text-gray-600">Consultations</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <p className="text-gray-600">No usage data available yet</p>
              <p className="text-sm text-gray-500 mt-2">Usage will appear here after you receive booking requests or consultations</p>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-500">
            Last updated: {(() => {
              const lastUpdated = billingSummary?.usage?.lastUpdated;
              if (!lastUpdated) return 'Never';
              if (lastUpdated instanceof Date) return lastUpdated.toLocaleDateString();
              if (lastUpdated.toDate) return lastUpdated.toDate().toLocaleDateString();
              return 'Unknown';
            })()}
          </div>
        </div>

        {/* Billing Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCardIcon className="h-5 w-5 mr-2" />
            Billing Status
          </h2>
          
          {billingSummary?.billingAccount ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  billingSummary.billingAccount.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : billingSummary.billingAccount.status === 'past_due'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {billingSummary.billingAccount.status.charAt(0).toUpperCase() + 
                   billingSummary.billingAccount.status.slice(1)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Billing Email:</span>
                <span className="text-gray-900">{billingSummary.billingAccount.billingEmail}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Stripe Customer ID:</span>
                <span className="text-gray-900 font-mono text-sm">{billingSummary.billingAccount.stripeCustomerId}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subscription ID:</span>
                <span className="text-gray-900 font-mono text-sm">{billingSummary.billingAccount.subscriptionId}</span>
              </div>
              
              {billingSummary.currentPeriodStart && billingSummary.currentPeriodEnd && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Current Period:</span>
                    <span className="text-gray-900">
                      {billingSummary.currentPeriodStart.toLocaleDateString()} - {billingSummary.currentPeriodEnd.toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Next Billing:</span>
                    <span className="text-gray-900">
                      {billingSummary.currentPeriodEnd.toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancelBilling}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Cancel Billing Account
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Billing Account</h3>
              <p className="text-gray-600 mb-6">
                Set up billing to continue using Glamslot after your free tier
              </p>
              <button
                onClick={handleSetupBilling}
                disabled={settingUpBilling}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {settingUpBilling ? 'Setting up...' : 'Set Up Billing with Stripe'}
              </button>
            </div>
          )}
        </div>

        {/* Pricing Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Pay per request</div>
                <div className="text-sm text-gray-600">$1 per appointment request or consultation</div>
              </div>
              <div className="text-2xl font-bold text-blue-600">$1</div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>• Billed monthly based on actual usage</p>
              <p>• No monthly fees or minimums</p>
              <p>• Cancel anytime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
