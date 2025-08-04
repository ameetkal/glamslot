import { NextResponse } from 'next/server'

export async function GET() {
  console.log('=== TEST BOOKING ENDPOINT CALLED ===')
  
  try {
    return NextResponse.json({
      success: true,
      message: 'Test booking endpoint working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test booking endpoint error:', error)
    return NextResponse.json({
      success: false,
      message: 'Test booking endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 