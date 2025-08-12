import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscriptionId')

    if (!subscriptionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Subscription ID is required' 
      }, { status: 400 })
    }

    console.log('🔍 Getting subscription item ID for subscription:', subscriptionId)

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    if (subscription.items.data.length > 0) {
      const subscriptionItemId = subscription.items.data[0].id
      console.log('✅ Found subscription item ID:', subscriptionItemId)
      
      return NextResponse.json({ 
        success: true, 
        subscriptionItemId 
      })
    }
    
    console.log('⚠️ No subscription items found for subscription:', subscriptionId)
    return NextResponse.json({ 
      success: false, 
      error: 'No subscription items found' 
    }, { status: 404 })

  } catch (error) {
    console.error('❌ Failed to get subscription item ID:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
