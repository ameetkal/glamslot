import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { customerId, quantity, timestamp } = await request.json()

    console.log('📊 === RECORDING USAGE TO STRIPE DIRECTLY ===')
    console.log('Customer ID:', customerId)
    console.log('Quantity:', quantity)
    console.log('Timestamp:', timestamp || 'now')

    // Record usage to Stripe via meter events using customer ID
    await stripe.billing.meterEvents.create({
      event_name: 'request_submission', // Your existing Stripe meter name
      payload: {
        value: quantity.toString(),
        stripe_customer_id: customerId
      }
    })

    console.log('✅ Usage recorded to Stripe via meter event: created successfully')
    
    return NextResponse.json({ 
      success: true, 
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
