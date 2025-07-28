import { NextRequest, NextResponse } from 'next/server'
import { bookingRequestService, salonService, providerService, teamService } from '@/lib/firebase/services'
import { smsService } from '@/lib/smsService'
import { sendEmail } from '@/lib/mailjet'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received booking request:', body)
    
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
      console.log('Missing required fields:', { service, dateTimePreference, name, phone, email, salonSlug })
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get salon by slug
    console.log('Looking up salon with slug:', salonSlug)
    const salon = await salonService.getSalonBySlug(salonSlug)
    if (!salon) {
      console.log('Salon not found for slug:', salonSlug)
      return NextResponse.json(
        { success: false, message: 'Salon not found' },
        { status: 404 }
      )
    }
    console.log('Found salon:', salon.name)

    // Create booking request
    const bookingRequest = {
      clientName: name,
      clientEmail: email,
      clientPhone: phone,
      service,
      stylistPreference: stylist || 'Any service provider',
      dateTimePreference,
      notes: notes || '',
      waitlistOptIn: waitlistOptIn || false,
      status: 'pending' as const,
      salonId: salon.id
    }

    console.log('Creating booking request:', bookingRequest)
    const requestId = await bookingRequestService.createBookingRequest(bookingRequest)
    console.log('Booking request created with ID:', requestId)

    // Send SMS notification to all enabled numbers in smsRecipients
    const smsRecipients = salon.settings?.notifications?.smsRecipients || [];
    const enabledSmsRecipients = Array.isArray(smsRecipients)
      ? smsRecipients.filter(r => r.enabled)
      : [];
    
    console.log('SMS notification check:', {
      smsEnabled: salon.settings?.notifications?.sms,
      totalRecipients: smsRecipients.length,
      enabledRecipients: enabledSmsRecipients.length,
      recipients: enabledSmsRecipients
    });
    
    if (enabledSmsRecipients.length > 0) {
      for (const recipient of enabledSmsRecipients) {
        try {
          const formattedPhone = smsService.formatPhoneNumber(recipient.phone);
          await smsService.sendBookingRequestNotification(formattedPhone);
          console.log(`SMS notification sent to ${formattedPhone} for booking request`);
        } catch (smsError) {
          console.error('Failed to send SMS notification:', smsError);
          // Don't fail the booking request if SMS fails
        }
      }
    } else {
      console.log(`No enabled SMS recipients configured for salon ${salon.name}, skipping SMS notification`);
    }

    // Send email notification to all enabled email recipients
    const emailRecipients = salon.settings?.notifications?.emailRecipients || [];
    const enabledEmailRecipients = Array.isArray(emailRecipients)
      ? emailRecipients.filter(r => r.enabled)
      : [];
    
    console.log('Email notification check:', {
      emailEnabled: salon.settings?.notifications?.email,
      totalRecipients: emailRecipients.length,
      enabledRecipients: enabledEmailRecipients.length,
      recipients: enabledEmailRecipients
    });
    
    if (enabledEmailRecipients.length > 0) {
      const bookingUrl = `${process.env.NEXT_PUBLIC_BOOKING_URL || 'https://last-minute-app.vercel.app'}/dashboard/requests`;
      
      for (const recipient of enabledEmailRecipients) {
        try {
          await sendEmail({
            to: recipient.email,
            subject: `New Booking Request - ${salon.name}`,
            text: `New booking request received from ${name} for ${service}. Visit ${bookingUrl} to view and manage the request.`,
            html: `
              <h2>New Booking Request</h2>
              <p><strong>Client:</strong> ${name}</p>
              <p><strong>Service:</strong> ${service}</p>
              <p><strong>Service Provider Preference:</strong> ${stylist || 'Any service provider'}</p>
              <p><strong>Date/Time:</strong> ${dateTimePreference}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
              <p><a href="${bookingUrl}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Booking Request</a></p>
            `
          });
          console.log(`Email notification sent to ${recipient.email} for booking request`);
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't fail the booking request if email fails
        }
      }
    } else {
      console.log(`No enabled email recipients configured for salon ${salon.name}, skipping email notification`);
    }

    // Send provider-specific notifications if a specific stylist was requested
    if (stylist && stylist !== 'Any stylist') {
      try {
        // Get all providers for this salon
        const providers = await providerService.getProviders(salon.id);
        const requestedProvider = providers.find(p => p.name === stylist);
        
                 if (requestedProvider && requestedProvider.receiveNotifications && requestedProvider.isTeamMember) {
           // Get the team member record to get the phone number
           const teamMembers = await teamService.getTeamMembers(salon.id);
           const teamMember = teamMembers.find((tm: import('@/types/firebase').TeamMember) => tm.id === requestedProvider.teamMemberId);
          
          if (teamMember && teamMember.phone) {
            try {
              const formattedPhone = smsService.formatPhoneNumber(teamMember.phone);
              await smsService.sendProviderBookingNotification(
                formattedPhone,
                requestedProvider.name,
                name,
                service,
                dateTimePreference
              );
              console.log(`Provider SMS notification sent to ${formattedPhone} for ${requestedProvider.name}`);
            } catch (providerSmsError) {
              console.error('Failed to send provider SMS notification:', providerSmsError);
              // Don't fail the booking request if provider SMS fails
            }
          } else {
            console.log(`Provider ${requestedProvider.name} has notifications enabled but no phone number found`);
          }
        } else {
          console.log(`Provider ${stylist} notifications not enabled or not a team member`);
        }
      } catch (providerError) {
        console.error('Error sending provider notifications:', providerError);
        // Don't fail the booking request if provider notifications fail
      }
    }

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