import { NextRequest, NextResponse } from 'next/server'
import { teamService, salonService } from '@/lib/firebase/services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract invitation data
    const {
      name,
      email,
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
      salonId,
      invitedBy
    })

    // TODO: Send email invitation
    // This would typically use a service like SendGrid, Mailgun, or Firebase Functions
    // For now, we'll just log the invitation details
    console.log('Invitation created:', {
      invitationId,
      salonName: salon.name,
      inviteeName: name,
      inviteeEmail: email,
      invitedBy,
      salonUrl: salon.bookingUrl
    })

    // In a real implementation, you would send an email like this:
    /*
    const emailService = EmailService.getInstance()
    await emailService.sendTeamInvitation({
      to: email,
      name: name,
      salonName: salon.name,
      invitedBy: invitedBy,
      invitationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/join/${invitationId}`,
      salonUrl: salon.bookingUrl
    })
    */

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
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