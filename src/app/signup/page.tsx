'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'



export default function SignupPage() {
  const { loginWithGoogle, signupWithPhone, verifyPhoneCode, createSalonForPhoneUser } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationId, setVerificationId] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [smsSent, setSmsSent] = useState(false)
  const [businessName, setBusinessName] = useState('')



  const handleGoogleSignup = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      await loginWithGoogle()
      router.push('/dashboard/requests')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneSignup = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number')
      return
    }

    if (!businessName.trim()) {
      setError('Please enter a business name')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const result = await signupWithPhone(phoneNumber, {
        name: 'Business Owner', // Default name for phone signup
        businessName: businessName,
        phone: phoneNumber,
        businessType: 'salon'
      })
      setVerificationId(result.verificationId)
      setSmsSent(true)
      setError('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to send SMS code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!smsCode.trim()) {
      setError('Please enter the SMS code')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      await verifyPhoneCode(verificationId, smsCode)
      
      // Create salon account for the phone-only user
      await createSalonForPhoneUser({
        name: 'Business Owner',
        businessName: businessName,
        phone: phoneNumber,
        businessType: 'salon'
      })
      
      router.push('/dashboard/requests')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Invalid SMS code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <motion.div 
        className="sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          GlamSlot
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          By Glammatic
        </p>
      </motion.div>

      <motion.div 
        className="mt-6 sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 ring-1 ring-gray-200">
          <h3 className="text-center text-xl font-semibold text-gray-900 mb-6">
            Create your account
          </h3>

                    {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Phone Auth Form */}
          <div className="space-y-6">
              {!smsSent ? (
                <>
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Your Salon Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <PhoneInput
                      international
                      defaultCountry="US"
                      value={phoneNumber}
                      onChange={(value) => setPhoneNumber(value || '')}
                      placeholder="Enter phone number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div id="recaptcha-container"></div>
                  
                  <button
                    type="button"
                    onClick={handlePhoneSignup}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending SMS...' : 'Send SMS Code'}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="smsCode" className="block text-sm font-medium text-gray-700 mb-2">
                      SMS Code
                    </label>
                    <input
                      type="text"
                      id="smsCode"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Code & Create Account'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setSmsSent(false)
                      setVerificationId('')
                      setSmsCode('')
                    }}
                    className="w-full text-gray-600 py-2 px-4 rounded-md font-medium hover:text-gray-800 focus:outline-none"
                  >
                    Use Different Number
                  </button>
                </>
              )}
            </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isLoading}
                className="inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Sign up with Google</span>
                <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                <span className="ml-2">Sign up with Google</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold leading-6 text-accent-600 hover:text-accent-500 transition-colors duration-200">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
} 