'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { teamService } from '@/lib/firebase/services'
import { TeamMember } from '@/types/firebase'

interface DebugInfo {
  userId?: string
  userEmail?: string | null
  timestamp?: string
  teamMember?: TeamMember | null
  isTeamMember?: boolean
  teamMemberError?: string
  salonId?: string
  salonExists?: boolean
  salonData?: Record<string, unknown>
  salonError?: string
  bookingRequestsCount?: number
  bookingRequestsAccess?: 'success' | 'failed'
  bookingRequestsError?: string
  totalBookingRequests?: number
  sampleRequests?: Array<{
    id: string
    salonId: string
    clientName: string
    status: string
  }>
  sampleRequestsError?: string
  generalError?: string
}

export default function DebugPermissionsPage() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const runDebugChecks = async () => {
      if (!user) return

      const info: DebugInfo = {
        userId: user.uid,
        userEmail: user.email,
        timestamp: new Date().toISOString()
      }

      try {
        // Check 1: Can we access team members collection
        console.log('Checking team member access...')
        try {
          const userTeamMember = await teamService.getTeamMemberByUserId(user.uid)
          info.teamMember = userTeamMember
          info.isTeamMember = !!userTeamMember
          console.log('Team member lookup successful:', userTeamMember)
        } catch (error) {
          info.teamMemberError = error instanceof Error ? error.message : 'Unknown error'
          console.error('Team member lookup failed:', error)
        }

        // Check 2: Determine salon ID
        const salonId = info.teamMember?.salonId || user.uid
        info.salonId = salonId

        // Check 3: Can we access salon document
        console.log('Checking salon document access...')
        try {
          const salonDocRef = doc(db, 'salons', salonId)
          const salonDoc = await getDoc(salonDocRef)
          info.salonExists = salonDoc.exists()
          if (salonDoc.exists()) {
            info.salonData = salonDoc.data()
          }
          console.log('Salon document access successful')
        } catch (error) {
          info.salonError = error instanceof Error ? error.message : 'Unknown error'
          console.error('Salon document access failed:', error)
        }

        // Check 4: Can we query booking requests
        console.log('Checking booking requests access...')
        try {
          const requestsQuery = query(
            collection(db, 'bookingRequests'),
            where('salonId', '==', salonId)
          )
          const snapshot = await getDocs(requestsQuery)
          info.bookingRequestsCount = snapshot.size
          info.bookingRequestsAccess = 'success'
          console.log('Booking requests access successful')
        } catch (error) {
          info.bookingRequestsError = error instanceof Error ? error.message : 'Unknown error'
          info.bookingRequestsAccess = 'failed'
          console.error('Booking requests access failed:', error)
        }

        // Check 5: List some booking requests to see their salonId
        console.log('Checking booking requests data...')
        try {
          const allRequestsQuery = query(collection(db, 'bookingRequests'))
          const allSnapshot = await getDocs(allRequestsQuery)
          info.totalBookingRequests = allSnapshot.size
          info.sampleRequests = allSnapshot.docs.slice(0, 3).map(doc => ({
            id: doc.id,
            salonId: doc.data().salonId,
            clientName: doc.data().clientName,
            status: doc.data().status
          }))
          console.log('Sample booking requests retrieved')
        } catch (error) {
          info.sampleRequestsError = error instanceof Error ? error.message : 'Unknown error'
          console.error('Sample requests access failed:', error)
        }

      } catch (error) {
        info.generalError = error instanceof Error ? error.message : 'Unknown error'
        console.error('General debug error:', error)
      }

      setDebugInfo(info)
      setLoading(false)
    }

    runDebugChecks()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Running debug checks...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Firebase Permissions Debug</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">User Information</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>User ID:</strong> {debugInfo.userId}</p>
                <p><strong>Email:</strong> {debugInfo.userEmail}</p>
                <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Team Member Status</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>Is Team Member:</strong> {debugInfo.isTeamMember ? 'Yes' : 'No'}</p>
                {debugInfo.teamMember && (
                  <div className="mt-2">
                    <p><strong>Team Member Data:</strong></p>
                    <pre className="text-sm bg-white p-2 rounded border">
                      {JSON.stringify(debugInfo.teamMember, null, 2)}
                    </pre>
                  </div>
                )}
                {debugInfo.teamMemberError && (
                  <p className="text-red-600"><strong>Error:</strong> {debugInfo.teamMemberError}</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Salon Access</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>Salon ID:</strong> {debugInfo.salonId}</p>
                <p><strong>Salon Exists:</strong> {debugInfo.salonExists ? 'Yes' : 'No'}</p>
                {debugInfo.salonData && (
                  <div className="mt-2">
                    <p><strong>Salon Data:</strong></p>
                    <pre className="text-sm bg-white p-2 rounded border">
                      {JSON.stringify(debugInfo.salonData, null, 2)}
                    </pre>
                  </div>
                )}
                {debugInfo.salonError && (
                  <p className="text-red-600"><strong>Error:</strong> {debugInfo.salonError}</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Booking Requests Access</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>Access Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    debugInfo.bookingRequestsAccess === 'success' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {debugInfo.bookingRequestsAccess}
                  </span>
                </p>
                {debugInfo.bookingRequestsCount !== undefined && (
                  <p><strong>Requests Found:</strong> {debugInfo.bookingRequestsCount}</p>
                )}
                {debugInfo.bookingRequestsError && (
                  <p className="text-red-600"><strong>Error:</strong> {debugInfo.bookingRequestsError}</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Sample Booking Requests</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>Total Requests in System:</strong> {debugInfo.totalBookingRequests}</p>
                {debugInfo.sampleRequests && (
                  <div className="mt-2">
                    <p><strong>Sample Requests:</strong></p>
                    <pre className="text-sm bg-white p-2 rounded border">
                      {JSON.stringify(debugInfo.sampleRequests, null, 2)}
                    </pre>
                  </div>
                )}
                {debugInfo.sampleRequestsError && (
                  <p className="text-red-600"><strong>Error:</strong> {debugInfo.sampleRequestsError}</p>
                )}
              </div>
            </div>

            {debugInfo.generalError && (
              <div>
                <h2 className="text-lg font-semibold mb-2">General Error</h2>
                <div className="bg-red-50 p-4 rounded">
                  <p className="text-red-600">{debugInfo.generalError}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 