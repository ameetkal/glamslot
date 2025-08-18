'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { salonService } from '@/lib/firebase/services'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface WizardData {
  fullName: string
  email: string
  mobilePhone: string
  businessType: string
  customBusinessType: string
  selectedProducts: string[]
}

const PRODUCTS = [
  { id: 'website', name: 'Website', description: 'Professional business page' },
  { id: 'bookings', name: 'Appointment Bookings', description: 'Online booking system' },
  { id: 'consultations', name: 'Virtual Consultations', description: 'Client consultation forms' }
]

export default function SetupWizardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardData, setWizardData] = useState<WizardData>({
    fullName: '',
    email: '',
    mobilePhone: '',
    businessType: 'salon',
    customBusinessType: '',
    selectedProducts: ['website', 'bookings', 'consultations'] // Pre-selected
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Determine which steps to show based on signup method
  const getSteps = () => {
    if (!user) return []
    
    const steps = []
    
    // Phone signup: need full name and email
    if (!user.email) {
      steps.push('fullName', 'email')
    }
    // Email signup: need mobile phone
    else if (!user.phoneNumber) {
      steps.push('mobilePhone')
    }
    // Google signup: need mobile phone
    else {
      steps.push('mobilePhone')
    }
    
    // Business type and products are always shown
    steps.push('businessType', 'products')
    
    return steps
  }

  const steps = getSteps()
  const totalSteps = steps.length
  const progress = ((currentStep + 1) / totalSteps) * 100

  // Debug logging
  console.log('🔍 Setup Wizard Debug:', {
    steps,
    totalSteps,
    currentStep,
    progress,
    userEmail: user?.email,
    userPhone: user?.phoneNumber
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Pre-fill existing data
    const prefillData = async () => {
      try {
        const salonData = await salonService.getSalon(user.uid)
        if (salonData) {
          setWizardData(prev => ({
            ...prev,
            fullName: salonData.ownerName || '',
            email: salonData.ownerEmail || '',
            mobilePhone: salonData.ownerPhone || '',
            businessType: salonData.businessType || 'salon'
          }))
        }
      } catch (error) {
        console.error('Error fetching salon data:', error)
      }
    }

    prefillData()
  }, [user, router])

  const handleInputChange = (field: keyof WizardData, value: string) => {
    setWizardData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProductToggle = (productId: string) => {
    setWizardData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(id => id !== productId)
        : [...prev.selectedProducts, productId]
    }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipStep = () => {
    nextStep()
  }

  const handleSubmit = async () => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      // Update salon data
      const updateData: Record<string, unknown> = {}
      
      if (wizardData.fullName) updateData.ownerName = wizardData.fullName
      if (wizardData.email) updateData.ownerEmail = wizardData.email
      if (wizardData.mobilePhone) updateData.ownerPhone = wizardData.mobilePhone
      
      const businessType = wizardData.businessType === 'other' 
        ? wizardData.customBusinessType 
        : wizardData.businessType
      updateData.businessType = businessType

      // Generate URLs for selected products
      const salonData = await salonService.getSalon(user.uid)
      if (salonData) {
        const externalLinks: Record<string, string> = {}
        
        if (wizardData.selectedProducts.includes('website')) {
          externalLinks.glampage = `https://glamslot.vercel.app/glampage/${salonData.slug}`
        }
        if (wizardData.selectedProducts.includes('bookings')) {
          externalLinks.bookNow = `https://glamslot.vercel.app/booking/${salonData.slug}`
        }
        // Virtual consultation is a built-in feature, not an external link
        
        // Always include default shop URL for SalonInteractive
        externalLinks.shop = 'https://www.saloninteractive.com/'
        
        updateData.externalLinks = externalLinks
      }

      await salonService.updateSalon(user.uid, updateData)
      
      // Redirect to Links tab to show the new URLs
      router.push('/dashboard/settings/links')
    } catch (error) {
      console.error('Error updating salon data:', error)
      setError('Failed to save your information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    const currentStepType = steps[currentStep]
    
    switch (currentStepType) {
      case 'fullName':
        return (
          <motion.div
            key="fullName"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              What&apos;s your full name?
            </h2>
            <p className="text-gray-700 mb-8">
              This is the name that will appear as the owner of your business
            </p>
            <div className="max-w-md mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={wizardData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-lg text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  placeholder="Enter your full name"
                />
              </div>
            </div>
          </motion.div>
        )

      case 'email':
        return (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              What&apos;s your email address?
            </h2>
            <p className="text-gray-700 mb-8">
              We&apos;ll use this to send you important updates about your business
            </p>
            <div className="max-w-md mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={wizardData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-lg text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          </motion.div>
        )

      case 'mobilePhone':
        return (
          <motion.div
            key="mobilePhone"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              What&apos;s your mobile phone number?
            </h2>
            <p className="text-gray-700 mb-8">
              We&apos;ll use this to send you SMS notifications about your business
            </p>
            <div className="max-w-md mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={wizardData.mobilePhone}
                  onChange={(e) => handleInputChange('mobilePhone', e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-lg text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </motion.div>
        )

      case 'businessType':
        return (
          <motion.div
            key="businessType"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              What type of business do you run?
            </h2>
            <p className="text-gray-700 mb-8">
              This helps us customize your experience
            </p>
            <div className="max-w-md mx-auto space-y-4">
              <select
                value={wizardData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              >
                <option value="salon" className="text-gray-900">Salon</option>
                <option value="spa" className="text-gray-900">Spa</option>
                <option value="barbershop" className="text-gray-900">Barbershop</option>
                <option value="independent" className="text-gray-900">Independent Professional</option>
                <option value="other" className="text-gray-900">Other</option>
              </select>
              
              {wizardData.businessType === 'other' && (
                <input
                  type="text"
                  value={wizardData.customBusinessType}
                  onChange={(e) => handleInputChange('customBusinessType', e.target.value)}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg text-lg text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  placeholder="Please specify your business type"
                />
              )}
            </div>
          </motion.div>
        )

      case 'products':
        return (
          <motion.div
            key="products"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Which free GlamSlot products do you want?
            </h2>
            <p className="text-gray-700 mb-8">
              All products are completely free and ready to use
            </p>
            <div className="max-w-md mx-auto space-y-4">
              {PRODUCTS.map((product) => (
                <label key={product.id} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={wizardData.selectedProducts.includes(product.id)}
                    onChange={() => handleProductToggle(product.id)}
                    className="h-5 w-5 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 text-left">
                    <div className="text-lg font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-700">{product.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-center text-sm text-gray-700 font-medium">
            Step {currentStep + 1} of {totalSteps}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-6 py-3 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {currentStep > 0 ? '← Back' : ''}
            </button>

            <div className="flex gap-3">
              {currentStep < totalSteps - 1 ? (
                <>
                  <button
                    onClick={skipStep}
                    className="px-6 py-3 text-gray-700 hover:text-gray-900 transition-colors font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Skip
                  </button>
                  <button
                    onClick={nextStep}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                  >
                    Next
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium shadow-sm"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Get Started
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
