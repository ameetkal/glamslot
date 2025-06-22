import { NextRequest, NextResponse } from 'next/server'
import { teamService, salonService } from '@/lib/firebase/services'
import { mailjetService } from '@/lib/mailjet'

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

    // Generate invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${invitationId}`

    // Send email invitation via Mailjet
    const emailSent = await mailjetService.sendTeamInvitation({
      to: {
        email,
        name
      },
      salonName: salon.name,
      invitedBy,
      invitationUrl,
      salonUrl: salon.bookingUrl
    })

    if (!emailSent) {
      console.error('Failed to send invitation email via Mailjet')
      // Still return success since invitation was created, but log the issue
      console.log('=== INVITATION CREATED (EMAIL FAILED) ===')
      console.log('Invitation ID:', invitationId)
      console.log('Salon Name:', salon.name)
      console.log('Invitee Name:', name)
      console.log('Invitee Email:', email)
      console.log('Invited By:', invitedBy)
      console.log('Invitation URL:', invitationUrl)
      console.log('Salon URL:', salon.bookingUrl)
      console.log('========================')
    } else {
      console.log('Invitation email sent successfully via Mailjet')
    }

    return NextResponse.json({
      success: true,
      message: emailSent ? 'Invitation sent successfully' : 'Invitation created but email failed to send',
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