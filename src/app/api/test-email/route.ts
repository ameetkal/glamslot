import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailjet';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email address is required' },
        { status: 400 }
      );
    }

    // Check environment variables
    const envCheck = {
      MAILJET_API_KEY: !!process.env.MAILJET_API_KEY,
      MAILJET_API_SECRET: !!process.env.MAILJET_API_SECRET,
      MAILJET_FROM_EMAIL: process.env.MAILJET_FROM_EMAIL || 'not set',
      MAILJET_FROM_NAME: process.env.MAILJET_FROM_NAME || 'not set'
    };

    console.log('Environment variables check:', envCheck);

    // Try to send a test email
    const emailResult = await sendEmail({
      to: email,
      subject: 'Test Email - Salon Booking System',
      text: 'This is a test email to verify the email service is working correctly.',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify the email service is working correctly.</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `
    });

    if (emailResult) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        envCheck
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send test email',
        envCheck
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 