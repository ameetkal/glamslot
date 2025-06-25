'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loyaltyProgramService, customerPassService, salonService, clientService } from '@/lib/firebase/services'
import { generatePassId } from '@/lib/utils'
import { Client, CustomerPass, LoyaltyProgram, Salon } from '@/types/firebase'

export default function LoyaltyRegistrationPage({ params }: { params: Promise<{ programId: string }> }) {
  const resolvedParams = use(params)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [program, setProgram] = useState<LoyaltyProgram | null>(null)
  const [salon, setSalon] = useState<Salon | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchProgramData = async () => {
      try {
        const programData = await loyaltyProgramService.getLoyaltyProgram(resolvedParams.programId)
        if (programData) {
          setProgram(programData)
          const salonData = await salonService.getSalon(programData.salonId)
          setSalon(salonData)
        }
      } catch {
        setError('Failed to load program details.')
      } finally {
        setLoading(false)
      }
    }
    fetchProgramData()
  }, [resolvedParams.programId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      console.log('Starting loyalty registration...')
      if (!program) {
        setError('Program data not available.')
        setIsSubmitting(false)
        return
      }

      const salonId = program.salonId
      console.log('Program data:', { programId: program.id, salonId, programName: program.name })

      // 2. Look up existing client by email or phone
      console.log('Looking up existing client...')
      const client: Client | null = await clientService.findClientByEmailOrPhone(salonId, form.email, form.phone)
      console.log('Existing client found:', client?.id || 'none')
      let clientId: string
      
      // 4. Generate unique pass ID
      const passId = generatePassId(salonId)
      console.log('Generated pass ID:', passId)
      
      // Create loyalty data
      const loyaltyData = {
        passId,
        currentVisits: 0,
        totalVisits: program.visitsRequired,
        rewardsEarned: 0,
        loyaltyProgramId: program.id,
        passAddedAt: new Date().toISOString(),
      }
      console.log('Loyalty data:', loyaltyData)

      if (client) {
        // Update existing client with loyalty data
        clientId = client.id
        console.log('Updating existing client with loyalty data...')
        await clientService.updateClientLoyalty(clientId, loyaltyData)
        console.log('Client loyalty data updated successfully')
      } else {
        // 3. Create new client with loyalty data
        console.log('Creating new client with loyalty data...')
        clientId = await clientService.createClient({
          name: form.name,
          email: form.email,
          phone: form.phone,
          salonId,
          loyalty: loyaltyData
        })
        console.log('New client created with ID:', clientId)
      }

      // 5. Create CustomerPass
      console.log('Creating customer pass...')
      const customerPass: Omit<CustomerPass, 'id' | 'createdAt' | 'updatedAt'> = {
        passId,
        salonId,
        loyaltyProgramId: program.id,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        currentVisits: 0,
        totalVisits: program.visitsRequired,
        isRedeemed: false,
      }
      await customerPassService.createCustomerPass(customerPass)
      console.log('Customer pass created successfully')

      // 6. Redirect to pass page
      console.log('Registration completed successfully, redirecting...')
      router.push(`/loyalty/${resolvedParams.programId}/pass/${passId}`)
    } catch (err) {
      console.error('Registration error details:', err)
      setError(`Registration failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    )
  }

  if (error && !program) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-2 text-red-600">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
        </div>
      </div>
    )
  }

  const rewardText = program ? (
    program.rewardType === 'percentage' ? `${program.rewardValue}% off` :
    program.rewardType === 'fixed' ? `$${program.rewardValue} off` :
    program.rewardValue
  ) : ''

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {salon?.name || 'Salon'} Rewards
          </h1>
          <p className="text-gray-600">Join our loyalty program and start earning rewards!</p>
        </div>

        {/* Program Details */}
        {program && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-6 text-white text-center">
            <h2 className="text-xl font-bold mb-2">🎉 Special Offer</h2>
            <p className="text-lg">
              Visit {program.visitsRequired} times, get <strong>{rewardText}</strong>
            </p>
            {program.welcomeMessage && (
              <p className="text-blue-100 text-sm mt-2 italic">
                "{program.welcomeMessage}"
              </p>
            )}
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Sign Up Now
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your phone number"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating your pass...
                </span>
              ) : (
                'Join Loyalty Program'
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            By signing up, you agree to receive promotional messages from {salon?.name || 'this business'}.
          </p>
        </div>
      </div>
    </div>
  )
} 