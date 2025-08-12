import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { salonService } from '@/lib/firebase/services'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 === STRIPE CHECKOUT SESSION CREATION STARTED ===')
    
    const body = await request.json()
    const { salonId, email, name, phone } = body
    
    console.log('📋 Received checkout request:', { salonId, email, name, phone })
    
    // Validate required fields
    if (!salonId || !email) {
      console.log('❌ Missing required fields:', { salonId, email })
      return NextResponse.json(
        { error: 'Salon ID and email are required' },
        { status: 400 }
      )
    }
    
    // Get salon data to verify it exists
    console.log('🔍 Looking up salon:', salonId)
    const salon = await salonService.getSalon(salonId)
    if (!salon) {
      console.log('❌ Salon not found:', salonId)
      return NextResponse.json(
        { error: 'Salon not found' },
        { status: 404 }
      )
    }
    
    console.log('✅ Salon found:', salon.name)
    
    // Create or retrieve Stripe customer
    let customer: Stripe.Customer
    try {
                 // Check if customer already exists
           const existingCustomers = await stripe.customers.list({
             email: email,
             limit: 1,
           })
      
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0]
        console.log('✅ Existing customer found:', customer.id)
        
                       // Update customer metadata if needed
               if (customer.metadata.salonId !== salonId) {
                 customer = await stripe.customers.update(customer.id, {
                   metadata: { salonId }
                 })
                 console.log('✅ Customer metadata updated')
               }
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email,
          name,
          phone,
          metadata: {
            salonId,
          },
        })
        console.log('✅ New customer created:', customer.id)
      }
    } catch (customerError) {
      console.error('❌ Error with customer creation/retrieval:', customerError)
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      )
    }
    
    // Create Stripe Checkout session
    console.log('🔧 Creating checkout session for customer:', customer.id)
    
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID!, // Your usage-based price ID
            // No quantity for metered billing - Stripe calculates based on actual usage
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/billing?canceled=true`,
        metadata: {
          salonId,
          customerId: customer.id,
        },
        subscription_data: {
          metadata: {
            salonId,
            customerId: customer.id,
          },
        },
        // Enable automatic tax calculation if you have tax settings
        // automatic_tax: { enabled: true },
      })
    
    console.log('✅ Checkout session created:', session.id)
    console.log('🔗 Checkout URL:', session.url)
    
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
    })
    
  } catch (error) {
    console.error('❌ Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
