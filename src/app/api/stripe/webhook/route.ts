import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({ 
    message: 'Stripe webhook endpoint is working. Use POST for webhook events.',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('❌ No Stripe signature found')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('📨 === WEBHOOK RECEIVED ===')
    console.log('Event Type:', event.type)
    console.log('Event ID:', event.id)
    console.log('Timestamp:', new Date(event.created * 1000).toISOString())

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer)
        break
      
      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    console.log('✅ === WEBHOOK PROCESSED SUCCESSFULLY ===')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ === WEBHOOK PROCESSING FAILED ===')
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    })
    
    // Return 200 to prevent Stripe from retrying (we'll handle retries manually)
    return NextResponse.json({ 
      error: 'Webhook handler failed',
      timestamp: new Date().toISOString()
    }, { status: 200 })
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🎉 === SUBSCRIPTION CREATED WEBHOOK ===')
  console.log('Subscription ID:', subscription.id)
  console.log('Customer ID:', subscription.customer)
  console.log('Status:', subscription.status)
  
  try {
    // Extract metadata
    const salonId = subscription.metadata.salonId
    
    if (!salonId) {
      console.log('❌ No salonId in subscription metadata')
      return
    }
    
    console.log('🔍 Creating billing account for salon:', salonId)
    
    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    if (customer.deleted) {
      console.log('❌ Customer was deleted')
      return
    }
    
    // Create billing account in Firestore
    const billingAccount = {
      salonId,
      stripeCustomerId: customer.id,
      subscriptionId: subscription.id,
      status: subscription.status as 'active' | 'past_due' | 'canceled',
      billingEmail: customer.email || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    // Add to billing_accounts collection
    const { addDoc, collection, updateDoc, doc } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')
    
    const docRef = await addDoc(collection(db, 'billing_accounts'), billingAccount)
    console.log('✅ Billing account created with ID:', docRef.id)
    
    // Also update the salon document with the Stripe customer ID
    try {
      await updateDoc(doc(db, 'salons', salonId), {
        stripeCustomerId: customer.id,
        updatedAt: new Date()
      })
      console.log('✅ Salon document updated with Stripe customer ID:', customer.id)
    } catch (salonError) {
      console.log('⚠️ Could not update salon document:', salonError)
    }
    
  } catch (error) {
    console.error('❌ Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 === SUBSCRIPTION UPDATED WEBHOOK ===')
  console.log('Subscription ID:', subscription.id)
  console.log('New Status:', subscription.status)
  
  try {
    // Extract metadata
    const salonId = subscription.metadata.salonId
    
    if (!salonId) {
      console.log('❌ No salonId in subscription metadata')
      return
    }
    
    console.log('🔍 Updating billing account for salon:', salonId)
    
    // Update billing account status in Firestore
    const { updateDoc, doc, collection, query, where, getDocs } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')
    
    // Find billing account by subscription ID
    const billingRef = collection(db, 'billing_accounts')
    const q = query(billingRef, where('subscriptionId', '==', subscription.id))
    const snapshot = await getDocs(q)
    
    if (!snapshot.empty) {
      const billingDoc = snapshot.docs[0]
      await updateDoc(doc(db, 'billing_accounts', billingDoc.id), {
        status: subscription.status as 'active' | 'past_due' | 'canceled',
        updatedAt: new Date(),
      })
      console.log('✅ Billing account status updated to:', subscription.status)
    } else {
      console.log('❌ No billing account found for subscription:', subscription.id)
    }
    
  } catch (error) {
    console.error('❌ Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('🗑️ === SUBSCRIPTION DELETED WEBHOOK ===')
  console.log('Subscription ID:', subscription.id)
  
  try {
    // Extract metadata
    const salonId = subscription.metadata.salonId
    
    if (!salonId) {
      console.log('❌ No salonId in subscription metadata')
      return
    }
    
    console.log('🔍 Updating billing account status to canceled for salon:', salonId)
    
    // Update billing account status to canceled in Firestore
    const { updateDoc, doc, collection, query, where, getDocs } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')
    
    // Find billing account by subscription ID
    const billingRef = collection(db, 'billing_accounts')
    const q = query(billingRef, where('subscriptionId', '==', subscription.id))
    const snapshot = await getDocs(q)
    
    if (!snapshot.empty) {
      const billingDoc = snapshot.docs[0]
      await updateDoc(doc(db, 'billing_accounts', billingDoc.id), {
        status: 'canceled',
        updatedAt: new Date(),
      })
      console.log('✅ Billing account status updated to canceled')
    } else {
      console.log('❌ No billing account found for subscription:', subscription.id)
    }
    
  } catch (error) {
    console.error('❌ Error handling subscription deleted:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded for invoice:', invoice.id)
  
  try {
    // Handle successful payment
    // This could include updating usage records, sending confirmation emails, etc.
    console.log('Payment succeeded for customer:', invoice.customer)
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed for invoice:', invoice.id)
  
  try {
    // Handle failed payment
    // This could include updating subscription status, sending dunning emails, etc.
    console.log('Payment failed for customer:', invoice.customer)
  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Customer created:', customer.id)
  
  try {
    // Handle new customer creation
    // This could include setting up initial billing records
    console.log('New customer created:', customer.email)
  } catch (error) {
    console.error('Error handling customer created:', error)
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log('Customer updated:', customer.id)
  
  try {
    // Handle customer updates
    // This could include updating billing information
    console.log('Customer updated:', customer.email)
  } catch (error) {
    console.error('Error handling customer updated:', error)
  }
}
