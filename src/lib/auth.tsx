'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, userData: UserData) => Promise<void>
  logout: () => Promise<void>
  loginWithGoogle: () => Promise<void>
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

      // Get app URL from environment or use fallback
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

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
        bookingUrl: `${appUrl}/booking/${businessSlug}`,
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

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    loginWithGoogle
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