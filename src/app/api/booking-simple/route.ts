import { NextRequest, NextResponse } from 'next/server'

console.log('=== SIMPLE BOOKING API ROUTE LOADED ===')

export async function POST(request: NextRequest) {
  console.log('=== SIMPLE BOOKING API CALLED ===')
  
  try {
    console.log('=== PARSING REQUEST BODY ===')
    const body = await request.json()
    console.log('Received booking request:', body)
    
    // Just return success for now
    return NextResponse.json({
      success: true,
      message: 'Simple booking test successful',
      data: body
    })
  } catch (error) {
    console.error('=== SIMPLE BOOKING ERROR ===', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Simple booking test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 