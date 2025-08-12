import { db } from './firebase'
import { collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { StripeService, BillingAccount } from './stripe'
import { UsageTracker, UsageSummary } from './usageTracker'

export interface BillingAccountData {
  salonId: string
  stripeCustomerId: string
  subscriptionId: string
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'paused' | 'trialing' | 'unpaid'
  billingEmail: string
}

export interface BillingSummary {
  salonId: string
  usage: UsageSummary
  billingAccount?: BillingAccount
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  nextBillingDate?: Date
}

export class BillingService {
  // Create a new billing account
  static async createBillingAccount(
    salonId: string,
    email: string,
    name?: string,
    phone?: string
  ): Promise<BillingAccount> {
    try {
      // Create Stripe customer
      const customer = await StripeService.createCustomer(salonId, email, name, phone)
      
      // Create Stripe subscription
      const subscription = await StripeService.createSubscription(customer.id)
      
      // Create billing account in Firestore
      const billingAccount: Omit<BillingAccount, 'id'> = {
        salonId,
        stripeCustomerId: customer.id,
        subscriptionId: subscription.id,
        status: (() => {
          switch (subscription.status) {
            case 'incomplete':
              return 'active'
            case 'paused':
            case 'unpaid':
              return 'past_due'
            case 'trialing':
              return 'active'
            default:
              return subscription.status
          }
        })(),
        billingEmail: email,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      const docRef = await addDoc(collection(db, 'billing_accounts'), billingAccount)
      
      return {
        id: docRef.id,
        ...billingAccount,
      }
    } catch (error) {
      console.error('Error creating billing account:', error)
      throw new Error('Failed to create billing account')
    }
  }

  // Get billing account by salon ID
  static async getBillingAccount(salonId: string): Promise<BillingAccount | null> {
    try {
      const billingRef = collection(db, 'billing_accounts')
      const q = query(billingRef, where('salonId', '==', salonId), limit(1))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) return null
      
      const doc = snapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
      } as BillingAccount
    } catch (error) {
      console.error('Error getting billing account:', error)
      return null
    }
  }

  // Update billing account status
  static async updateBillingAccountStatus(
    billingAccountId: string,
    status: BillingAccount['status']
  ): Promise<boolean> {
    try {
      const docRef = doc(db, 'billing_accounts', billingAccountId)
      await updateDoc(docRef, {
        status,
        updatedAt: new Date(),
      })
      return true
    } catch (error) {
      console.error('Error updating billing account status:', error)
      return false
    }
  }

  // Get complete billing summary for a salon
  static async getBillingSummary(salonId: string): Promise<BillingSummary> {
    try {
      // Get usage summary
      const usage = await UsageTracker.getUsageSummary(salonId)
      
      // Get billing account
      const billingAccount = await this.getBillingAccount(salonId)
      
      let currentPeriodStart: Date | undefined
      let currentPeriodEnd: Date | undefined
      let nextBillingDate: Date | undefined
      
      // If there's an active subscription, get period info
      if (billingAccount && billingAccount.status === 'active') {
        try {
          const subscription = await StripeService.getSubscription(billingAccount.subscriptionId)
          if (subscription) {
            currentPeriodStart = subscription.currentPeriodStart
            currentPeriodEnd = subscription.currentPeriodEnd
            // Next billing date is the end of current period
            nextBillingDate = subscription.currentPeriodEnd
          }
        } catch (error) {
          console.error('Error getting subscription details:', error)
        }
      }
      
      return {
        salonId,
        usage,
        billingAccount: billingAccount || undefined,
        currentPeriodStart,
        currentPeriodEnd,
        nextBillingDate,
      }
    } catch (error) {
      console.error('Error getting billing summary:', error)
      throw new Error('Failed to get billing summary')
    }
  }

  // Cancel billing account
  static async cancelBillingAccount(billingAccountId: string): Promise<boolean> {
    try {
      const billingAccount = await getDoc(doc(db, 'billing_accounts', billingAccountId))
      if (!billingAccount.exists()) return false
      
      const data = billingAccount.data()
      
      // Cancel Stripe subscription
      const success = await StripeService.cancelSubscription(data.subscriptionId)
      if (!success) return false
      
      // Update status in Firestore
      await this.updateBillingAccountStatus(billingAccountId, 'canceled')
      
      return true
    } catch (error) {
      console.error('Error canceling billing account:', error)
      return false
    }
  }

  // Get all billing accounts (for admin use)
  static async getAllBillingAccounts(): Promise<BillingAccount[]> {
    try {
      const billingRef = collection(db, 'billing_accounts')
      const q = query(billingRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as BillingAccount[]
    } catch (error) {
      console.error('Error getting all billing accounts:', error)
      return []
    }
  }
}
