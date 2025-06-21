import { NextRequest, NextResponse } from 'next/server'
import { smsService } from '@/lib/smsService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Validate phone number format
    if (!smsService.validatePhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)' },
        { status: 400 }
      )
    }

    // Send test message
    const testMessage = '🧪 Test SMS from Last Minute App - SMS notifications are working!'
    
    const success = await smsService.sendNotification({
      to: phoneNumber,
      message: testMessage
    })

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test SMS sent successfully' 
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send test SMS' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Test SMS API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 