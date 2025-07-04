'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { teamService, salonService } from '@/lib/firebase/services'
import { Invitation, Salon } from '@/types/firebase'
import { motion } from 'framer-motion'
import { CheckIcon, XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline'

export default function JoinTeamPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loginWithGoogle, createAccountForInvite } = useAuth()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [salon, setSalon] = useState<Salon | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  })
  const [creatingAccount, setCreatingAccount] = useState(false)

  const invitationId = params.invitationId as string

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!invitationId) {
        setError('Invalid invitation link')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Fetch invitation details
        const invitationData = await teamService.getInvitation(invitationId)
        if (!invitationData) {
          setError('Invitation not found or has expired')
          setLoading(false)
          return
        }

        // Check if invitation is expired
        const expiresAt = invitationData.expiresAt instanceof Date ? 
          invitationData.expiresAt : 
          (invitationData.expiresAt && typeof invitationData.expiresAt === 'object' && 'toDate' in invitationData.expiresAt ? 
           (invitationData.expiresAt as { toDate: () => Date }).toDate() : new Date(invitationData.expiresAt))
        
        if (expiresAt < new Date()) {
          setError('This invitation has expired')
          setLoading(false)
          return
        }

        // Fetch salon details
        const salonData = await salonService.getSalon(invitationData.salonId)
        if (!salonData) {
          setError('Salon not found')
          setLoading(false)
          return
        }

        setInvitation(invitationData)
        setSalon(salonData)
      } catch (error) {
        console.error('Error fetching invitation:', error)
        setError('Failed to load invitation')
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [invitationId])

  const handleAcceptInvitation = async () => {
    if (!user || !invitation) return

    try {
      setJoining(true)
      setError('')

      // Add user to team
      const teamMemberId = await teamService.addTeamMember({
        name: invitation.name,
        email: invitation.email,
        phone: invitation.phone,
        role: invitation.role as 'owner' | 'admin' | 'front_desk' | 'service_provider' | 'member' || 'member',
        salonId: invitation.salonId,
        userId: user.uid
      })

      // Update invitation status
      await teamService.updateInvitation(invitation.id, {
        status: 'accepted'
      })

      // If this is a service provider, link them to their provider record
      if (invitation.role === 'service_provider') {
        await teamService.linkProviderToTeamMember(invitation.name, invitation.salonId, teamMemberId);
      }

      setSuccess('Successfully joined the team!')
      
      // Redirect to dashboard immediately
      router.push('/dashboard')
    } catch (error) {
      console.error('Error accepting invitation:', error)
      setError('Failed to accept invitation. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle()
      // After successful login, the component will re-render and user will be available
    } catch (error) {
      console.error('Error signing in with Google:', error)
      setError('Failed to sign in with Google')
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitation) return

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (passwordForm.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    try {
      setCreatingAccount(true)
      setError('')
      
      // Create account
      await createAccountForInvite(invitation.email, passwordForm.password)
      
      // Wait a moment for the user to be available, then accept invitation
      setTimeout(async () => {
        try {
          await handleAcceptInvitation()
        } catch (error) {
          console.error('Error accepting invitation after account creation:', error)
          setError('Account created but failed to accept invitation. Please try again.')
        }
      }, 1000)
      
    } catch (error) {
      console.error('Error creating account:', error)
      if (error instanceof Error && error.message.includes('already exists')) {
        setError('This email is already registered. Please try signing in with Google instead.')
        setShowPasswordForm(false) // Go back to the main options
      } else {
        setError(error instanceof Error ? error.message : 'Failed to create account. Please try again.')
      }
    } finally {
      setCreatingAccount(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <motion.div 
          className="sm:mx-auto sm:w-full sm:max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 ring-1 ring-gray-200">
            <div className="text-center">
              <XMarkIcon className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-lg font-semibold text-gray-900">Invitation Error</h3>
              <p className="mt-1 text-sm text-gray-600">{error}</p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-start pt-16 py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <motion.div 
        className="sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 ring-1 ring-gray-200">
          <div className="text-center">
            <UserPlusIcon className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Join Team</h2>
            <p className="mt-2 text-sm text-gray-600">
              You&apos;ve been invited to join {salon?.name}
            </p>
          </div>

          {success && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckIcon className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <XMarkIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Invitation Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div><span className="font-medium">Name:</span> {invitation?.name}</div>
                <div><span className="font-medium">Email:</span> {invitation?.email}</div>
                <div><span className="font-medium">Salon:</span> {salon?.name}</div>
                <div><span className="font-medium">Role:</span> {invitation?.role === 'service_provider' ? 'Service Provider' : invitation?.role === 'admin' ? 'Admin' : invitation?.role === 'front_desk' ? 'Front Desk' : 'Team Member'}</div>
              </div>
            </div>

            {creatingAccount ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Creating account and joining team...</p>
                </div>
              </div>
            ) : !user ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  Please sign in to accept this invitation
                </p>
                
                {!showPasswordForm ? (
                  <div className="space-y-3">
                    <button
                      onClick={handleGoogleSignIn}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="h-5 w-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                      </svg>
                      Sign in with Google
                    </button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Create Password
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateAccount} className="space-y-3">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Create Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        required
                        value={passwordForm.password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-500"
                        placeholder="Enter password"
                        minLength={6}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-500"
                        placeholder="Confirm password"
                        minLength={6}
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(false)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={creatingAccount}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creatingAccount ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          'Create Account & Join Team'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <button
                onClick={handleAcceptInvitation}
                disabled={joining}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
} 