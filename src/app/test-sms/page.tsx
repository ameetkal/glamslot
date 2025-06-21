'use client'

import { useState } from 'react'

export default function TestSMSPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleTestSMS = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess('')

    try {
      const response = await fetch('/api/sms/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
      } else {
        setSuccess(data.error)
      }
    } catch {
      setSuccess('Failed to send test SMS')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Test SMS Notifications</h1>
          
          <form onSubmit={handleTestSMS} className="space-y-4">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (E.164 format)
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use E.164 format: +1 for US numbers, +44 for UK, etc.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Test SMS'}
            </button>
          </form>

          {success && (
            <div className={`mt-4 p-4 rounded-md ${
              success.includes('Success') 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                success.includes('Success') ? 'text-green-800' : 'text-red-800'
              }`}>
                {success}
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-900 mb-2">How to Test:</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Make sure your Twilio credentials are set in .env.local</li>
              <li>2. Enter your phone number in E.164 format</li>
              <li>3. Click &quot;Send Test SMS&quot;</li>
              <li>4. Check your phone for the test message</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
} 