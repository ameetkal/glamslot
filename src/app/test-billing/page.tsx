'use client'

import { useState } from 'react'
import { UsageTracker } from '@/lib/usageTracker'

export default function TestBillingPage() {
  const [testSalonId, setTestSalonId] = useState('Cpac2PwkhCWEpM541bz5wPuCpCv2')
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testUsageTracking = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('🧪 Testing usage tracking...')
      
      // Test tracking a booking
      const bookingId = await UsageTracker.trackUsage(
        testSalonId,
        'booking',
        'test-user',
        `test-booking-${Date.now()}`
      )
      console.log('✅ Booking usage tracked:', bookingId)
      
      // Test tracking a consultation
      const consultationId = await UsageTracker.trackUsage(
        testSalonId,
        'consultation',
        'test-user',
        `test-consultation-${Date.now()}`
      )
      console.log('✅ Consultation usage tracked:', consultationId)
      
      // Get usage summary
      const summary = await UsageTracker.getUsageSummary(testSalonId)
      console.log('✅ Usage summary retrieved:', summary)
      
      setResult(`
🎉 Usage tracking test successful!

📊 Usage Summary:
- Total Requests: ${summary.totalRequests}
- Booking Count: ${summary.bookingCount}
- Consultation Count: ${summary.consultationCount}
- Last Updated: ${summary.lastUpdated.toLocaleString()}

🆔 Generated IDs:
- Booking: ${bookingId}
- Consultation: ${consultationId}

💡 Now refresh your billing page to see the updated counts!
      `)
    } catch (error) {
      console.error('❌ Usage tracking test failed:', error)
      setResult(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const clearTestData = async () => {
    setLoading(true)
    setResult('')
    
    try {
      setResult(`
ℹ️ Test data cleanup:
- In production, you'd want to delete test usage metrics
- Test data is currently stored in Firestore
- Salon ID: ${testSalonId}
- Note: This is just a placeholder - actual cleanup not implemented yet
      `)
    } catch (error) {
      setResult(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Usage Tracking Test Page</h1>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Salon ID:
            </label>
            <input
              type="text"
              value={testSalonId}
              onChange={(e) => setTestSalonId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a test salon ID"
            />
            <p className="text-sm text-gray-500 mt-1">
              Using your actual salon ID: {testSalonId}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={testUsageTracking}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Usage Tracking'}
            </button>
            
            <button
              onClick={clearTestData}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Clearing...' : 'Clear Test Data'}
            </button>
          </div>

          {result && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Test Results:</h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {result}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What This Tests:</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Usage tracking for booking requests and consultations</li>
            <li>• Firestore write operations for usage metrics</li>
            <li>• Usage summary queries and aggregation</li>
            <li>• Error handling and graceful failures</li>
          </ul>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
            <p className="text-blue-800 text-sm">
              After testing usage tracking, visit the billing page at{' '}
              <code className="bg-blue-100 px-1 rounded">/dashboard/settings/billing</code>{' '}
              to see the updated usage counts.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
