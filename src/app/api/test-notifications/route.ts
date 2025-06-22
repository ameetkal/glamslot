import { NextRequest, NextResponse } from 'next/server'
import { salonService } from '@/lib/firebase/services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { salonSlug } = body

    if (!salonSlug) {
      return NextResponse.json(
        { success: false, message: 'Salon slug is required' },
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

    // Return notification settings for debugging
    const notificationSettings = salon.settings?.notifications || {}
    
    return NextResponse.json({
      success: true,
      salon: {
        id: salon.id,
        name: salon.name,
        slug: salon.slug
      },
      notificationSettings: {
        email: notificationSettings.email,
        sms: notificationSettings.sms,
        smsRecipients: notificationSettings.smsRecipients || [],
        emailRecipients: notificationSettings.emailRecipients || [],
        bookingConfirmation: notificationSettings.bookingConfirmation,
        bookingReminders: notificationSettings.bookingReminders
      },
      enabledSmsRecipients: (notificationSettings.smsRecipients || []).filter(r => r.enabled),
      enabledEmailRecipients: (notificationSettings.emailRecipients || []).filter(r => r.enabled)
    })
  } catch (error) {
    console.error('Error testing notifications:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 