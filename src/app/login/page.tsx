'use client'

import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import { useAuth } from '@/lib/auth'


const schema = yup.object({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().required('Password is required'),
}).required()

type LoginFormData = yup.InferType<typeof schema>

export default function LoginPage() {
  const { login, loginWithGoogle, loginWithPhone, verifyPhoneCode, resendPhoneCode } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [displayDigits, setDisplayDigits] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('🇺🇸+1')
  const [verificationId, setVerificationId] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [smsSent, setSmsSent] = useState(false)



  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')
    
    try {
      await login(data.email, data.password)
      router.push('/dashboard/requests')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      await loginWithGoogle()
      
      // After Google sign-in, check if user has a salon document
      // If not, they're a new user and need to go through setup
      // This will be handled by the auth state change
      router.push('/dashboard/requests')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneLogin = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number')
      return
    }

    // Validate phone number format
    // if (!phoneNumber.startsWith('+')) {
    //   setError('Please enter a valid phone number with country code (e.g., +1234567890)')
    //   return
    // }
    
    // Basic length validation - PhoneInput should handle the rest
    if (phoneNumber.length < 10) {
      setError('Please enter a complete phone number')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const result = await loginWithPhone("+"+phoneNumber)
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
      router.push('/dashboard/requests')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Invalid SMS code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number')
      return
    }

    // Validate phone number format
    if (!phoneNumber.startsWith('+')) {
      setError('Please enter a valid phone number with country code (e.g., +1234567890)')
      return
    }
    
    // Basic length validation - PhoneInput should handle the rest
    if (phoneNumber.length < 10) {
      setError('Please enter a complete phone number')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const result = await resendPhoneCode(phoneNumber)
      setVerificationId(result.verificationId)
      setSmsCode('') // Clear the old code
      setError('')
      // Show success message
      setError('New SMS code sent! Please check your phone.')
      setTimeout(() => setError(''), 3000) // Clear success message after 3 seconds
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to resend SMS code')
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
            Welcome back!
          </h3>

          {/* Auth Method Toggle */}
          <div className="flex rounded-md shadow-sm mb-6">
            <button
              type="button"
              onClick={() => setAuthMethod('phone')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md border ${
                authMethod === 'phone'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Phone
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md border ${
                authMethod === 'email'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Email
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Email Auth Form */}
          {authMethod === 'email' && (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                disabled={isLoading}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                disabled={isLoading}
                {...register('password')}
              />

              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <Link href="/reset-password" className="font-medium text-blue-700 hover:text-blue-800">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          )}

          {/* Phone Auth Form */}
          {authMethod === 'phone' && (
            <div className="space-y-6">
              {!smsSent ? (
                <>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <select
                          value={selectedCountry}
                          onChange={(e) => {
                            const newCountry = e.target.value
                            const digitsOnly = displayDigits
                            const countryCode = newCountry.replace(/^[^\d]+/, '') // Extract just the +number part
                            const newPhoneNumber = countryCode + digitsOnly
                            
                            console.log('🔧 Country changed to:', newCountry)
                            console.log('🔧 Country code extracted:', countryCode)
                            console.log('🔧 Digits preserved:', digitsOnly)
                            console.log('🔧 New phone number:', newPhoneNumber)
                            
                            setSelectedCountry(newCountry)
                            setPhoneNumber(newPhoneNumber)
                          }}
                          className="text-gray-900 text-lg font-medium bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer [appearance:none] [-webkit-appearance:none] [-moz-appearance:none]"
                          disabled={isLoading}
                        >
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+1">🇨🇦 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+61">🇦🇺 +61</option>
                          <option value="+86">🇨🇳 +86</option>
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+81">🇯🇵 +81</option>
                          <option value="+49">🇩🇪 +49</option>
                          <option value="+33">🇫🇷 +33</option>
                        </select>
                      </div>
                      <input
                        type="tel"
                        value={displayDigits}
                        onChange={(e) => {
                          // Only allow digits
                          const digitsOnly = e.target.value.replace(/\D/g, '')
                          const countryCode = selectedCountry.replace(/^[^\d]+/, '') // Extract just the +number part
                          const fullNumber = countryCode + digitsOnly
                          
                          console.log('🔧 Raw input value:', e.target.value)
                          console.log('🔧 Cleaned digits only:', digitsOnly)
                          console.log('🔧 Selected country:', selectedCountry)
                          console.log('🔧 Country code extracted:', countryCode)
                          console.log('🔧 Full phone number:', fullNumber)
                          console.log('🔧 Total length:', fullNumber.length)
                          
                          setDisplayDigits(digitsOnly)
                          setPhoneNumber(fullNumber)
                        }}
                        placeholder="(555) 123-4567"
                        className="w-full pl-20 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                        maxLength={15} // Allow for longer country codes
                      />
                    </div>
                  </div>
                  
                  {/* Hidden reCAPTCHA container for invisible verification */}
                  <div id="recaptcha-container" className="hidden"></div>
                  
                  <button
                    type="button"
                    onClick={handlePhoneLogin}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Sending...' : 'Resend Code'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setSmsSent(false)
                        setVerificationId('')
                        setSmsCode('')
                      }}
                      className="flex-1 text-gray-700 py-2 px-4 rounded-md font-medium hover:text-gray-900 focus:outline-none"
                    >
                      Use Different Number
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-700">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Sign in with Google</span>
                <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                <span className="ml-2">Sign in with Google</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-700">
            Not a member?{' '}
            <Link href="/signup" className="font-semibold leading-6 text-accent-600 hover:text-accent-500 transition-colors duration-200">
              Sign up now
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
} 