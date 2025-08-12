export interface UsageRecord {
  id: string
  total_usage: number
}

export class StripeUsageService {
  /**
   * Record usage to Stripe via server API
   */
  static async recordUsage(
    subscriptionItemId: string,
    quantity: number = 1,
    timestamp?: number
  ): Promise<unknown> {
    try {
      console.log('📊 === RECORDING USAGE TO STRIPE VIA API ===')
      console.log('Subscription Item ID:', subscriptionItemId)
      console.log('Quantity:', quantity)
      console.log('Timestamp:', timestamp || 'now')
      
      // Call the server API to record usage (since we can't access Stripe secret key on client)
      const response = await fetch('/api/stripe/record-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionItemId,
          quantity,
          timestamp
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to record usage')
      }

      const result = await response.json()
      console.log('✅ Usage recorded to Stripe via API:', result.message)
      return result
    } catch (error) {
      console.error('❌ Failed to record usage to Stripe:', error)
      throw error
    }
  }

  /**
   * Get subscription item ID from subscription
   */
  static async getSubscriptionItemId(subscriptionId: string): Promise<string | null> {
    try {
      // Call the server API to get subscription item ID
      const response = await fetch(`/api/stripe/subscription-item?subscriptionId=${subscriptionId}`)
      
      if (!response.ok) {
        console.error('Failed to get subscription item ID')
        return null
      }

      const result = await response.json()
      return result.subscriptionItemId || null
    } catch (error) {
      console.error('❌ Failed to get subscription item ID:', error)
      return null
    }
  }

  // Note: Other Stripe usage retrieval methods are temporarily disabled
  // They will be re-implemented using the new API when needed
}
