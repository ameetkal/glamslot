'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { customerPassService, loyaltyProgramService } from '@/lib/firebase/services'
import { CustomerPass, LoyaltyProgram } from '@/types/firebase'

export default function LoyaltyPassPage({ params }: { params: Promise<{ programId: string, passId: string }> }) {
  const resolvedParams = use(params)
  const [pass, setPass] = useState<CustomerPass | null>(null)
  const [program, setProgram] = useState<LoyaltyProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const passData = await customerPassService.getCustomerPassByPassId(resolvedParams.passId)
        if (!passData) {
          setError('Pass not found.')
          setLoading(false)
          return
        }
        setPass(passData)
        const programData = await loyaltyProgramService.getLoyaltyProgram(resolvedParams.programId)
        setProgram(programData)
      } catch {
        setError('Failed to load pass.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [resolvedParams.passId, resolvedParams.programId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Loading pass...</div>
      </div>
    )
  }

  if (error || !pass || !program) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-2 text-red-600">Error</h2>
          <p className="text-gray-700 mb-4">{error || 'Pass not found.'}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
            onClick={() => router.push('/')}>
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Your Loyalty Pass</h1>
        <p className="text-gray-700 mb-4">{program.description}</p>
        <div className="my-6">
          <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-6 py-4">
            <div className="text-lg font-bold text-blue-900 mb-1">{pass.customerName}</div>
            <div className="text-sm text-blue-700 mb-2">Pass ID: <span className="font-mono">{pass.passId}</span></div>
            <div className="flex justify-center items-center space-x-2 mt-2">
              <span className="text-sm text-gray-600">Visits:</span>
              <span className="text-lg font-semibold text-blue-900">{pass.currentVisits} / {pass.totalVisits}</span>
            </div>
            <div className="mt-2">
              {pass.isRedeemed ? (
                <span className="text-green-600 font-medium">Reward earned!</span>
              ) : (
                <span className="text-blue-600 font-medium">Keep visiting to earn your reward!</span>
              )}
            </div>
          </div>
        </div>
        {/* Placeholder for Apple Wallet integration */}
        <div className="mt-6">
          <button
            className="w-full px-4 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-900 mb-2"
            disabled
          >
            Add to Apple Wallet (Coming Soon)
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Show this pass at the salon to record your visit.
        </div>
      </div>
    </div>
  )
} 