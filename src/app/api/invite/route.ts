import { NextRequest, NextResponse } from 'next/server'
import { teamService, salonService } from '@/lib/firebase/services'
import { smsService } from '@/lib/smsService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
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

    // Validate required fields
    if (!name || !email || !salonId || !invitedBy) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get salon information for the invitation email
    const salon = await salonService.getSalon(salonId)
    if (!salon) {
      return NextResponse.json(
        { success: false, message: 'Salon not found' },
        { status: 404 }
      )
    }

    // Create invitation in Firestore
    const invitationId = await teamService.createInvitation({
      email,
      name,
      phone,
      role,
      permissions,
      salonId,
      invitedBy
    })

    // Generate invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${invitationId}`

    // Send SMS invitation
    let smsSent = false;
    if (phone) {
      try {
        const formattedPhone = smsService.formatPhoneNumber(phone);
        const message = `🔔 You've been invited to join ${salon.name}! Click here to join and view appointment booking requests: ${invitationUrl}`;
        
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
    console.error('Error sending invitation:', error)
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