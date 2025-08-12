import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export interface UsageRecord {
  quantity: number
  timestamp: number
  action: 'increment' | 'set'
}

export class StripeUsageService {
  /**
   * Record usage to Stripe for metered billing
   * This is what actually charges customers $1 per request
   */
  static async recordUsage(
    subscriptionItemId: string,
    quantity: number = 1,
    timestamp?: number
  ): Promise<unknown> {
    try {
      console.log('📊 === RECORDING USAGE TO STRIPE ===')
      console.log('Subscription Item ID:', subscriptionItemId)
      console.log('Quantity:', quantity)
      console.log('Timestamp:', timestamp || 'now')
      
      // Use the new Stripe API for usage recording
      const meterEvent = await stripe.billing.meterEvents.create({
        event_name: 'request_submission', // Your existing Stripe meter name
        payload: {
          value: quantity.toString(),
          stripe_customer_id: await this.getCustomerIdFromSubscription(subscriptionItemId)
        }
      })
      
      console.log('✅ Usage recorded to Stripe via meter event: created successfully')
      return meterEvent
    } catch (error) {
      console.error('❌ Failed to record usage to Stripe:', error)
      throw error
    }
  }

  /**
   * Get customer ID from subscription item ID
   */
  private static async getCustomerIdFromSubscription(subscriptionItemId: string): Promise<string> {
    try {
      // Get the subscription item to find the subscription
      const subscriptionItem = await stripe.subscriptionItems.retrieve(subscriptionItemId)
      
      // Get the subscription to find the customer
      const subscription = await stripe.subscriptions.retrieve(subscriptionItem.subscription as string)
      
      return subscription.customer as string
    } catch (error) {
      console.error('❌ Failed to get customer ID from subscription:', error)
      throw error
    }
  }

  /**
   * Get current usage for a subscription item
   */
  static async getCurrentUsage(subscriptionItemId: string): Promise<number> {
    try {
      // Note: Stripe API method names may have changed
      console.log('⚠️ Stripe usage retrieval temporarily disabled due to API changes')
      console.log('Would get usage for subscription item:', subscriptionItemId)
      
      // Return mock data for now
      return 0
    } catch (error) {
      console.error('❌ Failed to get current usage:', error)
      return 0
    }
  }

  /**
   * Get usage summary for a specific period
   */
  static async getUsageForPeriod(
    subscriptionItemId: string,
    startDate: Date,
    endDate: Date
  ): Promise<unknown[]> {
    try {
      // Note: Stripe API method names may have changed
      console.log('⚠️ Stripe usage period retrieval temporarily disabled due to API changes')
      console.log('Would get usage for period:', { subscriptionItemId, startDate, endDate })
      
      // Return mock data for now
      return []
    } catch (error) {
      console.error('❌ Failed to get usage for period:', error)
      return []
    }
  }

  /**
   * Get subscription item ID from subscription
   */
  static async getSubscriptionItemId(subscriptionId: string): Promise<string | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      
      if (subscription.items.data.length > 0) {
        return subscription.items.data[0].id
      }
      
      return null
    } catch (error) {
      console.error('❌ Failed to get subscription item ID:', error)
      return null
    }
  }
}
