import { NextRequest, NextResponse } from 'next/server'
import { smsService } from '@/lib/smsService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message, type, salonPhone, salonSlug } = body

    // Validate required fields
    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to and message' },
        { status: 400 }
      )
    }

    // Validate phone number format
    if (!smsService.validatePhoneNumber(to)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)' },
        { status: 400 }
      )
    }

    let success = false

    // Handle different types of notifications
    if (type === 'booking_request' && salonPhone && salonSlug) {
      success = await smsService.sendBookingRequestNotification(
        salonPhone
      )
    } else {
      // Send general notification
      success = await smsService.sendNotification({
        to,
        message
      })
    }

    if (success) {
      return NextResponse.json({ success: true, message: 'SMS sent successfully' })
    } else {
      return NextResponse.json(
        { error: 'Failed to send SMS' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('SMS API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'SMS API is running' })
} 