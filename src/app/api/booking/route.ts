import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    // TODO: Save booking request to database
    console.log('Received booking request:', data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit booking request' }, { status: 500 })
  }
} 