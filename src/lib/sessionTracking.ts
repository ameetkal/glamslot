import { addDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export interface SessionData {
  id: string
  salonId: string
  sessionId: string
  userAgent: string
  ipAddress?: string
  referrer?: string
  timestamp: Date
  type: 'session_start' | 'form_start' | 'form_complete'
  formData?: {
    step: number
    service?: string
    provider?: string
  }
}

export class SessionTrackingService {
  private static instance: SessionTrackingService

  static getInstance(): SessionTrackingService {
    if (!SessionTrackingService.instance) {
      SessionTrackingService.instance = new SessionTrackingService()
    }
    return SessionTrackingService.instance
  }

  // Generate a unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Track when someone visits a booking URL
  async trackSessionStart(salonId: string, userAgent: string, ipAddress?: string, referrer?: string): Promise<string> {
    const sessionId = this.generateSessionId()
    
    try {
      await addDoc(collection(db, 'sessions'), {
        salonId,
        sessionId,
        userAgent,
        ipAddress,
        referrer,
        timestamp: serverTimestamp(),
        type: 'session_start'
      })
      
      // Store session ID in localStorage for this session
      if (typeof window !== 'undefined') {
        localStorage.setItem(`session_${salonId}`, sessionId)
      }
      
      return sessionId
    } catch (error) {
      console.error('Error tracking session start:', error)
      return sessionId
    }
  }

  // Track when someone starts filling out the booking form
  async trackFormStart(salonId: string, sessionId?: string): Promise<void> {
    const currentSessionId = sessionId || this.getCurrentSessionId(salonId)
    
    if (!currentSessionId) {
      // If no session ID, create a new session
      await this.trackSessionStart(salonId, navigator.userAgent)
      return
    }

    try {
      await addDoc(collection(db, 'sessions'), {
        salonId,
        sessionId: currentSessionId,
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp(),
        type: 'form_start',
        formData: {
          step: 1
        }
      })
    } catch (error) {
      console.error('Error tracking form start:', error)
    }
  }

  // Track form progress
  async trackFormProgress(salonId: string, step: number, formData?: { service?: string; provider?: string }): Promise<void> {
    const sessionId = this.getCurrentSessionId(salonId)
    
    if (!sessionId) return

    try {
      await addDoc(collection(db, 'sessions'), {
        salonId,
        sessionId,
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp(),
        type: 'form_start',
        formData: {
          step,
          ...formData
        }
      })
    } catch (error) {
      console.error('Error tracking form progress:', error)
    }
  }

  // Track when someone completes the booking form
  async trackFormComplete(salonId: string, sessionId?: string): Promise<void> {
    const currentSessionId = sessionId || this.getCurrentSessionId(salonId)
    
    if (!currentSessionId) return

    try {
      await addDoc(collection(db, 'sessions'), {
        salonId,
        sessionId: currentSessionId,
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp(),
        type: 'form_complete'
      })
    } catch (error) {
      console.error('Error tracking form complete:', error)
    }
  }

  // Get current session ID from localStorage
  private getCurrentSessionId(salonId: string): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(`session_${salonId}`)
  }

  // Get analytics data for a salon
  async getAnalyticsData(salonId: string): Promise<{
    totalSessions: number
    totalFormStarts: number
    totalFormCompletes: number
    formCompletionRate: number
  }> {
    try {
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('salonId', '==', salonId)
      )
      const snapshot = await getDocs(sessionsQuery)
      
      const sessions = snapshot.docs.map(doc => doc.data() as SessionData)
      
      const totalSessions = sessions.filter(s => s.type === 'session_start').length
      const totalFormStarts = sessions.filter(s => s.type === 'form_start').length
      const totalFormCompletes = sessions.filter(s => s.type === 'form_complete').length
      
      const formCompletionRate = totalFormStarts > 0 
        ? Math.round((totalFormCompletes / totalFormStarts) * 100) 
        : 0

      return {
        totalSessions,
        totalFormStarts,
        totalFormCompletes,
        formCompletionRate
      }
    } catch (error) {
      console.error('Error getting analytics data:', error)
      return {
        totalSessions: 0,
        totalFormStarts: 0,
        totalFormCompletes: 0,
        formCompletionRate: 0
      }
    }
  }
} 