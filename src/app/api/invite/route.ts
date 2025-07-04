import { NextRequest, NextResponse } from 'next/server'
import { teamService, salonService } from '@/lib/firebase/services'
import { smsService } from '@/lib/smsService'

export async function POST(request: NextRequest) {
  try {
    console.log('=== INVITATION REQUEST STARTED ===');
    
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    // Extract invitation data
    const {
      name,
      email,
      phone,
      role = 'member',
      permissions,
      salonId,
      invitedBy
    } = body

    console.log('Extracted data:', { name, email, phone, role, salonId, invitedBy })

    // Validate required fields
    if (!name || !email || !salonId || !invitedBy) {
      console.error('Missing required fields:', { name: !!name, email: !!email, salonId: !!salonId, invitedBy: !!invitedBy })
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Getting salon information...')
    // Get salon information for the invitation email
    const salon = await salonService.getSalon(salonId)
    if (!salon) {
      console.error('Salon not found for ID:', salonId)
      return NextResponse.json(
        { success: false, message: 'Salon not found' },
        { status: 404 }
      )
    }
    console.log('Salon found:', salon.name)

    console.log('Creating invitation in Firestore...')
    // Create invitation in Firestore - filter out undefined fields
    const invitationData: Record<string, unknown> = {
      email,
      name,
      phone,
      role,
      salonId,
      invitedBy
    };
    
    // Only include permissions if it's defined
    if (permissions !== undefined) {
      invitationData.permissions = permissions;
    }
    
    console.log('Invitation data being saved:', invitationData);
    const invitationId = await teamService.createInvitation(invitationData)
    console.log('Invitation created with ID:', invitationId)

    // Generate invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${invitationId}`
    console.log('Invitation URL:', invitationUrl)

    // Send SMS invitation
    let smsSent = false;
    if (phone) {
      try {
        console.log('Formatting phone number...')
        const formattedPhone = smsService.formatPhoneNumber(phone);
        console.log('Formatted phone:', formattedPhone)
        
        const message = `🔔 You've been invited to join ${salon.name}! Click here to join and view appointment booking requests: ${invitationUrl}`;
        console.log('SMS message:', message)
        
        console.log('Sending SMS notification...')
        smsSent = await smsService.sendNotification({
          to: formattedPhone,
          message: message,
          salonName: salon.name
        });
        
        if (smsSent) {
          console.log(`SMS invitation sent successfully to ${formattedPhone}`);
        } else {
          console.error('Failed to send SMS invitation');
        }
      } catch (smsError) {
        console.error('Error sending SMS invitation:', smsError);
        smsSent = false;
      }
    } else {
      console.log('No phone number provided, skipping SMS invitation');
    }

    // Log invitation details for debugging
    console.log('=== INVITATION CREATED ===');
    console.log('Invitation ID:', invitationId);
    console.log('Salon Name:', salon.name);
    console.log('Invitee Name:', name);
    console.log('Invitee Email:', email);
    console.log('Invitee Phone:', phone);
    console.log('Invited By:', invitedBy);
    console.log('Invitation URL:', invitationUrl);
    console.log('SMS Sent:', smsSent);
    console.log('========================');

    return NextResponse.json({
      success: true,
      message: smsSent ? 'SMS invitation sent successfully' : 'Invitation created but SMS failed to send',
      invitationId
    })
  } catch (error) {
    console.error('=== INVITATION ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    console.error('========================');
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('id')

    if (!invitationId) {
      return NextResponse.json(
        { success: false, message: 'Invitation ID required' },
        { status: 400 }
      )
    }

    // Delete invitation from Firestore
    await teamService.deleteInvitation(invitationId)

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling invitation:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 