import { NextResponse } from 'next/server'

export async function GET() {
  console.log('=== MINIMAL TEST START ===')
  
  try {
    // Test Firebase import
    console.log('Testing Firebase import...')
    const { bookingRequestService, salonService } = await import('@/lib/firebase/services')
    console.log('Firebase services imported successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Firebase services imported successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Minimal test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Firebase import failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 