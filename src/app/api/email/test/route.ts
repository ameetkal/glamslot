import { NextRequest, NextResponse } from 'next/server';
import { mailjetService } from '@/lib/mailjet';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email address required' },
        { status: 400 }
      );
    }

    // Send a test email
    const emailSent = await mailjetService.sendTeamInvitation({
      to: {
        email,
        name: email.split('@')[0] // Use email prefix as name
      },
      salonName: 'Test Salon',
      invitedBy: 'Test Admin',
      invitationUrl: 'https://example.com/join/test',
      salonUrl: 'https://example.com'
    });

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to send test email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 