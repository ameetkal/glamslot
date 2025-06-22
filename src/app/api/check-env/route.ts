import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    MAILJET_API_KEY: {
      exists: !!process.env.MAILJET_API_KEY,
      value: process.env.MAILJET_API_KEY ? `${process.env.MAILJET_API_KEY.substring(0, 8)}...` : 'not set'
    },
    MAILJET_API_SECRET: {
      exists: !!process.env.MAILJET_API_SECRET,
      value: process.env.MAILJET_API_SECRET ? `${process.env.MAILJET_API_SECRET.substring(0, 8)}...` : 'not set'
    },
    MAILJET_FROM_EMAIL: {
      exists: !!process.env.MAILJET_FROM_EMAIL,
      value: process.env.MAILJET_FROM_EMAIL || 'not set'
    },
    MAILJET_FROM_NAME: {
      exists: !!process.env.MAILJET_FROM_NAME,
      value: process.env.MAILJET_FROM_NAME || 'not set'
    },
    NEXT_PUBLIC_BOOKING_URL: {
      exists: !!process.env.NEXT_PUBLIC_BOOKING_URL,
      value: process.env.NEXT_PUBLIC_BOOKING_URL || 'not set'
    }
  }

  const allRequired = envCheck.MAILJET_API_KEY.exists && envCheck.MAILJET_API_SECRET.exists

  return NextResponse.json({
    success: allRequired,
    message: allRequired ? 'All required environment variables are set' : 'Missing required environment variables',
    envCheck,
    recommendations: allRequired ? [] : [
      'Set MAILJET_API_KEY in your environment variables',
      'Set MAILJET_API_SECRET in your environment variables',
      'Optional: Set MAILJET_FROM_EMAIL for custom sender email',
      'Optional: Set MAILJET_FROM_NAME for custom sender name'
    ]
  })
} 