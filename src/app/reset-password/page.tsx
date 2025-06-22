'use client'

import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import { useAuth } from '@/lib/auth'

const schema = yup.object({
  email: yup.string().email('Invalid email address').required('Email is required'),
}).required()

type ResetPasswordFormData = yup.InferType<typeof schema>

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess(false)
    
    try {
      await resetPassword(data.email)
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
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
          Booking Requests
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          by Glammatic
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
            Reset your password
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">
                Password reset email sent! Check your inbox and follow the instructions to reset your password.
              </p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              disabled={isLoading}
              {...register('email')}
            />

            <div>
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-accent-600 hover:text-accent-500 text-sm font-medium"
            >
              Back to login
            </Link>
          </div>

          <p className="mt-2 text-sm text-gray-600">
            Don&apos;t worry, we&apos;ll help you reset your password.
          </p>
        </div>
      </motion.div>
    </div>
  )
} 