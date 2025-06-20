import { NextRequest, NextResponse } from 'next/server'
import { bookingRequestService, salonService } from '@/lib/firebase/services'
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
      waitlistOptIn,
      salonSlug
    } = body

    // Validate required fields
    if (!service || !dateTimePreference || !name || !phone || !email || !salonSlug) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get salon by slug
    const salon = await salonService.getSalonBySlug(salonSlug)
    if (!salon) {
      return NextResponse.json(
        { success: false, message: 'Salon not found' },
        { status: 404 }
      )
    }

    // Create booking request
    const bookingRequest = {
      clientName: name,
      clientEmail: email,
      clientPhone: phone,
      service,
      stylistPreference: stylist || 'Any stylist',
      dateTimePreference,
      notes: notes || '',
      waitlistOptIn: waitlistOptIn || false,
      status: 'pending' as const,
      salonId: salon.id
    }

    const requestId = await bookingRequestService.createBookingRequest(bookingRequest)

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
      message: 'Booking request submitted successfully',
      requestId
    })
  } catch (error) {
    console.error('Error creating booking request:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 