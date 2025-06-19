import { NextRequest, NextResponse } from 'next/server'
import { SmsService } from '@/lib/smsService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract booking data
    const {
      service,
      stylist,
      dateTimePreference,
      name,
      phone,
      email,
      notes,
      waitlistOptIn
    } = body

    // TODO: Save booking request to database
    console.log('New booking request received:', {
      service,
      stylist,
      dateTimePreference,
      name,
      phone,
      email,
      notes,
      waitlistOptIn
    })

    // Send SMS notification to salon
    try {
      const smsService = SmsService.getInstance()
      await smsService.sendBookingRequestNotification()
    } catch (smsError) {
      console.error('Failed to send SMS notification:', smsError)
      // Don't fail the booking request if SMS fails
    }

    // TODO: Send email notification if configured

    return NextResponse.json({ 
      success: true, 
      message: 'Booking request submitted successfully' 
    })
  } catch (error) {
    console.error('Error processing booking request:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process booking request' },
      { status: 500 }
    )
  }
} 