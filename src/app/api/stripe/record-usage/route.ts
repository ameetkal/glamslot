import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { subscriptionItemId, quantity, timestamp } = await request.json()

    console.log('📊 === RECORDING USAGE TO STRIPE VIA API ===')
    console.log('Subscription Item ID:', subscriptionItemId)
    console.log('Quantity:', quantity)
    console.log('Timestamp:', timestamp || 'now')

    // Get the subscription item to find the subscription
    const subscriptionItem = await stripe.subscriptionItems.retrieve(subscriptionItemId)
    
    // Get the subscription to find the customer
    const subscription = await stripe.subscriptions.retrieve(subscriptionItem.subscription as string)
    
    // Record usage to Stripe via meter events
    await stripe.billing.meterEvents.create({
      event_name: 'request_submission', // Your existing Stripe meter name
      payload: {
        value: quantity.toString(),
        stripe_customer_id: subscription.customer as string
      }
    })

    console.log('✅ Usage recorded to Stripe via meter event: created successfully')
    
    return NextResponse.json({ 
      success: true, 
      meterEventId: 'created',
      message: 'Usage recorded successfully'
    })

  } catch (error) {
    console.error('❌ Failed to record usage to Stripe:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
