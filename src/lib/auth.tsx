'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithCredential
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { ROLE_PERMISSIONS } from './permissions'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, userData: UserData) => Promise<void>
  createAccountForInvite: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loginWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  loginWithPhone: (phoneNumber: string) => Promise<{ verificationId: string }>
  verifyPhoneCode: (verificationId: string, code: string) => Promise<void>
  signupWithPhone: (phoneNumber: string, userData: UserData) => Promise<{ verificationId: string }>
  createSalonForPhoneUser: (userData: UserData) => Promise<void>
  // SuperAdmin salon context switching
  selectedSalonId: string | null
  setSelectedSalonId: (salonId: string | null) => void
  isPlatformAdmin: boolean
  // Salon context override for SuperAdmin impersonation
  currentSalonId: string | null
  currentSalonName: string | null
}

interface UserData {
  name: string
  businessName: string
  phone: string
  businessType: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null)
  const [selectedSalonData, setSelectedSalonData] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Login failed')
    }
  }

  const signup = async (email: string, password: string, userData: UserData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Create a clean slug from business name
      const businessSlug = userData.businessName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim()

      // Create salon document with user ID as the document ID
      const salonData = {
        id: user.uid,
        name: userData.businessName,
        slug: businessSlug,
        bookingUrl: `https://glamslot.vercel.app/booking/${businessSlug}`,
        ownerName: userData.name,
        ownerEmail: email, // Keep email for email-based signups
        ownerPhone: userData.phone,
        businessType: userData.businessType,
        settings: {
          notifications: {
            email: !!email, // Only enable email notifications if email exists
            sms: true // Enable SMS notifications for phone users
          },
          booking: {
            requireConsultation: false,
            allowWaitlist: true
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await setDoc(doc(db, 'salons', user.uid), salonData)
      
      // Create team member record for the salon owner (admin role)
      const teamMemberData = {
        id: user.uid,
        name: userData.name,
        email: email,
        phone: userData.phone,
        role: 'admin', // Salon owners get admin role by default
        status: 'active',
        invitedAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        salonId: user.uid,
        userId: user.uid,
        permissions: ROLE_PERMISSIONS.admin // Full admin permissions
      }
      
      await setDoc(doc(db, 'teamMembers', user.uid), teamMemberData)
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Signup failed')
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      // Reset SuperAdmin salon context on logout
      setSelectedSalonId(null)
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Logout failed')
    }
  }

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Google login failed')
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Password reset failed')
    }
  }

  const loginWithPhone = async (phoneNumber: string) => {
    try {
      // Create reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': () => {
          console.log('reCAPTCHA solved')
        }
      })

      // Request SMS code
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
      return { verificationId: confirmationResult.verificationId }
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Phone login failed')
    }
  }

  const verifyPhoneCode = async (verificationId: string, code: string) => {
    try {
      // Create credential from verification ID and code
      const credential = PhoneAuthProvider.credential(verificationId, code)
      await signInWithCredential(auth, credential)
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Code verification failed')
    }
  }

  const signupWithPhone = async (phoneNumber: string, userData: UserData) => {
    try {
      // Create reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': () => {
          console.log('reCAPTCHA solved')
        }
      })

      // Request SMS code
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
      
      // Store user data temporarily for after verification
      sessionStorage.setItem('pendingUserData', JSON.stringify(userData))
      sessionStorage.setItem('verificationId', confirmationResult.verificationId)
      
      return { verificationId: confirmationResult.verificationId }
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Phone signup failed')
    }
  }

  const createSalonForPhoneUser = async (userData: UserData) => {
    try {
      // Create a clean slug from business name
      const businessSlug = userData.businessName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim()

      // Create salon document for phone-only user
      const salonData = {
        id: auth.currentUser?.uid,
        name: userData.businessName,
        slug: businessSlug,
        bookingUrl: `https://glamslot.vercel.app/booking/${businessSlug}`,
        ownerName: userData.name || 'Business Owner',
        ownerEmail: null, // No email for phone-only users
        ownerPhone: userData.phone,
        businessType: userData.businessType,
        settings: {
          notifications: {
            email: false, // Disable email notifications since no email
            sms: true // Enable SMS notifications
          },
          booking: {
            requireConsultation: false,
            allowWaitlist: true
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await setDoc(doc(db, 'salons', auth.currentUser!.uid), salonData)
      
      // Create team member record for the salon owner (admin role)
      const teamMemberData = {
        id: auth.currentUser!.uid,
        name: userData.name || 'Business Owner',
        email: null, // No email for phone-only users
        phone: userData.phone,
        role: 'admin', // Salon owners get admin role by default
        status: 'active',
        invitedAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        salonId: auth.currentUser!.uid,
        userId: auth.currentUser!.uid,
        permissions: ROLE_PERMISSIONS.admin // Full admin permissions
      }
      
      await setDoc(doc(db, 'teamMembers', auth.currentUser!.uid), teamMemberData)
      console.log('✅ Salon and admin team member created for phone-only user')
    } catch (error: unknown) {
      console.error('❌ Error creating salon for phone user:', error)
      throw new Error('Failed to create salon account')
    }
  }

  const createAccountForInvite = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Handle specific Firebase auth errors
        if (error.message.includes('auth/email-already-in-use')) {
          throw new Error('An account with this email already exists. Please try signing in with Google instead.')
        } else if (error.message.includes('auth/weak-password')) {
          throw new Error('Password is too weak. Please choose a stronger password (at least 6 characters).')
        } else if (error.message.includes('auth/invalid-email')) {
          throw new Error('Invalid email address. Please check your email and try again.')
        } else {
          throw new Error(`Account creation failed: ${error.message}`)
        }
      } else {
        throw new Error('Account creation failed. Please try again.')
      }
    }
  }

  // Check if user is a platform admin (SuperAdmin)
  const isPlatformAdmin = user?.email === 'ameet@gofisherman.com' || 
                         user?.email === 'ameetk96@gmail.com' || 
                         user?.email === 'nick@gofisherman.com'

  // Fetch selected salon data when selectedSalonId changes
  useEffect(() => {
    const fetchSelectedSalonData = async () => {
      if (!selectedSalonId || !isPlatformAdmin) {
        setSelectedSalonData(null)
        return
      }

      try {
        const { doc, getDoc } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        
        const salonRef = doc(db, 'salons', selectedSalonId)
        const salonDoc = await getDoc(salonRef)
        
        if (salonDoc.exists()) {
          const salonData = salonDoc.data()
          setSelectedSalonData({
            id: salonDoc.id,
            name: salonData.name || 'Unnamed Salon'
          })
        } else {
          setSelectedSalonData(null)
        }
      } catch (error) {
        console.error('Error fetching selected salon data:', error)
        setSelectedSalonData(null)
      }
    }

    fetchSelectedSalonData()
  }, [selectedSalonId, isPlatformAdmin])

  // Compute current salon context (either selected salon or user's own salon)
  const currentSalonId = selectedSalonId || user?.uid || null
  const currentSalonName = selectedSalonData?.name || null

  const value = {
    user,
    loading,
    login,
    signup,
    createAccountForInvite,
    logout,
    loginWithGoogle,
    resetPassword,
    loginWithPhone,
    verifyPhoneCode,
    signupWithPhone,
    createSalonForPhoneUser,
    // SuperAdmin salon context switching
    selectedSalonId,
    setSelectedSalonId,
    isPlatformAdmin,
    // Salon context override for SuperAdmin impersonation
    currentSalonId,
    currentSalonName
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 