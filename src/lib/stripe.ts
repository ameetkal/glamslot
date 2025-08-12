import Stripe from 'stripe'

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export interface StripeCustomer {
  id: string
  email: string
  name?: string
  phone?: string
  metadata: {
    salonId: string
  }
}

export interface StripeSubscription {
  id: string
  customerId: string
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'paused' | 'trialing' | 'unpaid'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
}

export interface BillingAccount {
  id: string
  salonId: string
  stripeCustomerId: string
  subscriptionId: string
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'paused' | 'trialing' | 'unpaid'
  billingEmail: string
  createdAt: Date
  updatedAt: Date
}

export class StripeService {
  // Create a new customer
  static async createCustomer(salonId: string, email: string, name?: string, phone?: string): Promise<StripeCustomer> {
    const customer = await stripe.customers.create({
      email,
      name,
      phone,
      metadata: {
        salonId,
      },
    })

    return {
      id: customer.id,
      email: customer.email!,
      name: customer.name || undefined,
      phone: customer.phone || undefined,
      metadata: customer.metadata as { salonId: string },
    }
  }

  // Create a subscription for a customer
  static async createSubscription(customerId: string): Promise<StripeSubscription> {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    // For incomplete subscriptions, we don't have period info yet
    const now = new Date()
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      status: (() => {
        switch (subscription.status) {
          case 'paused':
          case 'unpaid':
            return 'past_due'
          case 'trialing':
            return 'active'
          default:
            return subscription.status
        }
      })(),
      currentPeriodStart: now,
      currentPeriodEnd: oneMonthFromNow,
      cancelAtPeriodEnd: false,
    }
  }

  // Get customer by ID
  static async getCustomer(customerId: string): Promise<StripeCustomer | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) return null

      return {
        id: customer.id,
        email: customer.email!,
        name: customer.name || undefined,
        phone: customer.phone || undefined,
        metadata: customer.metadata as { salonId: string },
      }
    } catch (error) {
      console.error('Error retrieving customer:', error)
      return null
    }
  }

  // Get subscription by ID
  static async getSubscription(subscriptionId: string): Promise<StripeSubscription | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      
      // For retrieved subscriptions, we should have period info
      const now = new Date()
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      return {
        id: subscription.id,
        customerId: subscription.customer as string,
        status: (() => {
          switch (subscription.status) {
            case 'incomplete_expired':
              return 'canceled'
            case 'paused':
            case 'unpaid':
              return 'past_due'
            case 'trialing':
              return 'active'
            default:
              return subscription.status
          }
        })(),
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthFromNow,
        cancelAtPeriodEnd: false,
      }
    } catch (error) {
      console.error('Error retrieving subscription:', error)
      return null
    }
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await stripe.subscriptions.cancel(subscriptionId)
      return true
    } catch (error) {
      console.error('Error canceling subscription:', error)
      return false
    }
  }

  // Get usage records for metered billing
  // Note: This method is commented out due to Stripe API changes
  // static async getUsageRecords(subscriptionItemId: string, startDate: Date, endDate: Date) {
  //   try {
  //     const usageRecords = await stripe.subscriptionItems.listUsageRecords(
  //       subscriptionItemId,
  //       {
  //         start: Math.floor(startDate.getTime() / 1000),
  //         end: Math.floor(endDate.getTime() / 1000),
  //       }
  //     )
  //     return usageRecords.data
  //   } catch (error) {
  //     console.error('Error getting usage records:', error)
  //     return []
  //   }
  // }
}

export default stripe
