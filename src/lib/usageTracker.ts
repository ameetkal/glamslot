import { db } from './firebase'
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

export interface UsageMetric {
  id: string
  salonId: string
  type: 'booking' | 'consultation'
  timestamp: Date
  userId: string
  requestId: string
  createdAt: Date
}

export interface UsageSummary {
  salonId: string
  totalRequests: number
  bookingCount: number
  consultationCount: number
  lastUpdated: Date
}

export class UsageTracker {
  // Track a new usage metric
  static async trackUsage(
    salonId: string,
    type: 'booking' | 'consultation',
    userId: string,
    requestId: string
  ): Promise<string> {
    try {
      console.log('=== USAGE TRACKER.trackUsage CALLED ===')
      console.log('Parameters:', { salonId, type, userId, requestId })
      
      const usageMetric: Omit<UsageMetric, 'id'> = {
        salonId,
        type,
        timestamp: new Date(),
        userId,
        requestId,
        createdAt: new Date(),
      }
      
      console.log('Usage metric object created:', usageMetric)
      console.log('Adding document to usage_metrics collection...')
      
      const docRef = await addDoc(collection(db, 'usage_metrics'), usageMetric)
      console.log('✅ Document added successfully with ID:', docRef.id)
      
      // 🔥 NEW: Send usage to Stripe for billing
      try {
        await this.recordUsageToStripe(salonId)
        console.log('✅ Usage recorded to Stripe for billing')
      } catch (stripeError) {
        console.error('⚠️ Failed to record usage to Stripe (billing may not be set up):', stripeError)
        // Don't fail the usage tracking if Stripe recording fails
      }
      
      return docRef.id
    } catch (error) {
      console.error('❌ Error in trackUsage:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error && 'code' in error ? String(error.code) : 'No code',
        stack: error instanceof Error ? error.stack : 'No stack'
      })
      throw error
    }
  }

  /**
   * Record usage to Stripe using salon's Stripe customer ID
   */
  private static async recordUsageToStripe(salonId: string): Promise<void> {
    try {
      // Get the salon document to find Stripe customer ID
      const { doc, getDoc } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      
      const salonRef = doc(db, 'salons', salonId)
      const salonDoc = await getDoc(salonRef)
      
      if (!salonDoc.exists()) {
        console.log('⚠️ Salon not found:', salonId)
        return
      }
      
      const salonData = salonDoc.data()
      
      // Check if salon has Stripe customer ID
      if (!salonData.stripeCustomerId) {
        console.log('ℹ️ Salon has no Stripe customer ID, skipping usage recording')
        return
      }
      
      console.log('🔍 Found Stripe customer ID, recording usage to Stripe...')
      
      // Record usage directly to Stripe using the salon's customer ID
      const { StripeUsageService } = await import('./stripeUsageService')
      await StripeUsageService.recordUsageDirect(salonData.stripeCustomerId, 1)
      console.log('✅ Usage recorded to Stripe: $1 charged for this request')
      
    } catch (error) {
      console.error('❌ Error recording usage to Stripe:', error)
      throw error
    }
  }

  // Get usage summary for a salon
  static async getUsageSummary(salonId: string): Promise<UsageSummary> {
    try {
      console.log('Getting usage summary for salon:', salonId)
      const metricsRef = collection(db, 'usage_metrics')
      
      // Get all metrics for this salon
      const q = query(
        metricsRef,
        where('salonId', '==', salonId),
        orderBy('timestamp', 'desc')
      )
      
      console.log('Executing usage query...')
      const snapshot = await getDocs(q)
      console.log('Usage query result:', snapshot.size, 'documents found')
      
      const metrics = snapshot.docs.map(doc => doc.data() as UsageMetric)
      console.log('Usage metrics:', metrics)
      
      const bookingCount = metrics.filter(m => m.type === 'booking').length
      const consultationCount = metrics.filter(m => m.type === 'consultation').length
      
      const summary = {
        salonId,
        totalRequests: metrics.length,
        bookingCount,
        consultationCount,
        lastUpdated: metrics.length > 0 ? 
          (metrics[0].timestamp instanceof Date ? metrics[0].timestamp : (metrics[0].timestamp as { toDate: () => Date }).toDate()) : 
          new Date(),
      }
      
      console.log('Usage summary created:', summary)
      return summary
    } catch (error) {
      console.error('Error getting usage summary:', error)
      throw error
    }
  }

  // Get usage for a specific time period
  static async getUsageForPeriod(
    salonId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageMetric[]> {
    const metricsRef = collection(db, 'usage_metrics')
    
    const q = query(
      metricsRef,
      where('salonId', '==', salonId),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UsageMetric[]
  }

  // Get recent usage (last N requests)
  static async getRecentUsage(salonId: string, limitCount: number = 10): Promise<UsageMetric[]> {
    const metricsRef = collection(db, 'usage_metrics')
    
    const q = query(
      metricsRef,
      where('salonId', '==', salonId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UsageMetric[]
  }

  // Get monthly usage for billing
  static async getMonthlyUsage(salonId: string, year: number, month: number): Promise<UsageMetric[]> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)
    
    return this.getUsageForPeriod(salonId, startDate, endDate)
  }
}
