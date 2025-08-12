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
        ownerEmail: email,
        ownerPhone: userData.phone,
        businessType: userData.businessType,
        settings: {
          notifications: {
            email: true,
            sms: false
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
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Signup failed')
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
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
    signupWithPhone
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