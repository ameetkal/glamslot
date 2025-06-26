'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, QrCodeIcon, GiftIcon, CameraIcon, BeakerIcon } from '@heroicons/react/24/outline'
import LoyaltyProgramForm from '@/components/forms/LoyaltyProgramForm'
import QRCodeDisplay from '@/components/ui/QRCodeDisplay'
import QRCodeScanner from '@/components/ui/QRCodeScanner'
import TestQRGenerator from '@/components/ui/TestQRGenerator'
import ManualEntryModal from '@/components/ui/ManualEntryModal'
import { useAuth } from '@/lib/auth'
import { salonService, loyaltyProgramService, visitRecordService } from '@/lib/firebase/services'
import { LoyaltyProgram, VisitRecord } from '@/types/firebase'

interface Redemption {
  id: string
  customerName: string
  customerInitials: string
  currentVisits: number
  totalVisits: number
  rewardEarned: boolean
  timestamp: Date
  color: string
}

export default function LoyaltyPage() {
  const { user } = useAuth()
  const [hasProgram, setHasProgram] = useState(false)
  const [currentProgram, setCurrentProgram] = useState<LoyaltyProgram | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isTestGeneratorOpen, setIsTestGeneratorOpen] = useState(false)
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const [salonName, setSalonName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [recentRedemptions, setRecentRedemptions] = useState<Redemption[]>([
    {
      id: '1',
      customerName: 'Jane Doe',
      customerInitials: 'JD',
      currentVisits: 5,
      totalVisits: 5,
      rewardEarned: true,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      color: 'blue'
    },
    {
      id: '2',
      customerName: 'Mike Smith',
      customerInitials: 'MS',
      currentVisits: 3,
      totalVisits: 5,
      rewardEarned: false,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      color: 'green'
    },
    {
      id: '3',
      customerName: 'Alice Johnson',
      customerInitials: 'AS',
      currentVisits: 4,
      totalVisits: 5,
      rewardEarned: false,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      color: 'purple'
    }
  ])

  useEffect(() => {
    const fetchSalonAndProgram = async () => {
      if (!user) return
      
      try {
        // Fetch salon name
        const salon = await salonService.getSalon(user.uid)
        if (salon && salon.name) {
          setSalonName(salon.name)
        }

        // Fetch existing loyalty program from Firebase
        const programs = await loyaltyProgramService.getLoyaltyPrograms(user.uid)
        if (programs.length > 0) {
          setCurrentProgram(programs[0]) // Use the first/most recent program
          setHasProgram(true)
        }

        // Fetch recent visits from Firebase
        const visits = await visitRecordService.getRecentVisits(user.uid)
        if (visits) {
          const redemptions = visits.map((visit: VisitRecord) => {
            // Get customer initials from name
            const initials = visit.customerName
              .split(' ')
              .map(name => name.charAt(0))
              .join('')
              .toUpperCase()
              .slice(0, 2)
            
            return {
              id: visit.id,
              customerName: visit.customerName,
              customerInitials: initials,
              currentVisits: 0, // This would need to be fetched from customer pass
              totalVisits: 0,   // This would need to be fetched from customer pass
              rewardEarned: false, // This would need to be calculated
              timestamp: new Date(visit.recordedAt),
              color: 'blue'
            }
          })
          setRecentRedemptions(redemptions)
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching salon data:', error)
        setIsLoading(false)
      }
    }

    fetchSalonAndProgram()
  }, [user])

  const handleCreateProgram = async (programData: {
    visitsRequired: number
    rewardValue: string
    rewardType: 'percentage' | 'fixed' | 'service'
    expirationDays?: number
    welcomeMessage?: string
  }) => {
    if (!user) return

    try {
      setIsLoading(true)
      
      // Create the loyalty program with all required fields
      const programId = await loyaltyProgramService.createLoyaltyProgram({
        salonId: user.uid,
        name: `Loyalty Program`,
        description: `Visit ${programData.visitsRequired} times, get ${programData.rewardType === 'percentage' ? `${programData.rewardValue}% off` : programData.rewardType === 'fixed' ? `$${programData.rewardValue} off` : programData.rewardValue}`,
        visitsRequired: programData.visitsRequired,
        rewardType: programData.rewardType,
        rewardValue: programData.rewardValue,
        expirationDays: programData.expirationDays,
        welcomeMessage: programData.welcomeMessage,
        isActive: true
      })

      // Fetch the created program
      const newProgram = await loyaltyProgramService.getLoyaltyProgram(programId)
      if (newProgram) {
        setCurrentProgram(newProgram)
        setHasProgram(true)
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Error creating loyalty program:', error)
      setIsLoading(false)
    }
  }

  const handleScanSuccess = (scannedData: { customerName?: string; currentVisits?: number; program: { visitsRequired: number } }) => {
    // TODO: Process the scan and update customer visit count in Firebase
    console.log('Scan successful:', scannedData)
    
    // Create a new redemption record
    const newRedemption: Redemption = {
      id: Date.now().toString(),
      customerName: scannedData.customerName || 'Unknown Customer',
      customerInitials: (scannedData.customerName || 'UC').split(' ').map((n: string) => n[0]).join('').toUpperCase(),
      currentVisits: (scannedData.currentVisits || 0) + 1,
      totalVisits: scannedData.program.visitsRequired,
      rewardEarned: (scannedData.currentVisits || 0) + 1 >= scannedData.program.visitsRequired,
      timestamp: new Date(),
      color: ['blue', 'green', 'purple', 'pink', 'indigo'][Math.floor(Math.random() * 5)]
    }
    
    // Add to recent redemptions (at the top)
    setRecentRedemptions(prev => [newRedemption, ...prev.slice(0, 9)]) // Keep only 10 most recent
    
    // Show success message
    const message = newRedemption.rewardEarned 
      ? `Congratulations! ${newRedemption.customerName} has earned their reward!`
      : `Visit recorded for ${newRedemption.customerName}. Progress: ${newRedemption.currentVisits}/${newRedemption.totalVisits}`
    
    alert(message)
    
    // Close the scanner
    setIsScannerOpen(false)
  }

  const formatProgramDescription = (program: LoyaltyProgram) => {
    const rewardText = program.rewardType === 'percentage' ? `${program.rewardValue}% off` :
                      program.rewardType === 'fixed' ? `$${program.rewardValue} off` :
                      program.rewardValue
    
    return `Visit ${program.visitsRequired} times, Get ${rewardText}`
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return `${Math.floor(diffInSeconds / 2592000)} months ago`
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
        <p className="text-gray-600 mt-2">
          Create and manage your salon's loyalty program to reward repeat customers
        </p>
      </div>

      {!hasProgram ? (
        /* No program created yet */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <GiftIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No loyalty program yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first loyalty program to start rewarding your customers
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Loyalty Program
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Program exists - show management interface */
        <div className="space-y-6">
          {/* Program Overview Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {currentProgram && formatProgramDescription(currentProgram)}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Created on {currentProgram?.createdAt ? new Date(currentProgram.createdAt).toLocaleDateString() : 'Unknown date'}
                </p>
                {currentProgram?.welcomeMessage && (
                  <p className="text-sm text-gray-600 mt-1 italic">
                    &quot;{currentProgram.welcomeMessage}&quot;
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsQRCodeOpen(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <QrCodeIcon className="h-4 w-4 mr-2" />
                  View QR Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Edit Program clicked, setting isFormOpen to true')
                    setIsFormOpen(true)
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Program
                </button>
              </div>
            </div>
          </div>

          {/* Scanner Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Record Customer Visit
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Scan QR codes or manually enter customer pass IDs to record visits
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* QR Scanner Option */}
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <CameraIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h4 className="text-base font-medium text-gray-900 mb-2">Scan QR Code</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Use camera to scan customer&apos;s loyalty pass QR code
                </p>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CameraIcon className="h-4 w-4 mr-2" />
                  Open Scanner
                </button>
              </div>

              {/* Manual Entry Option */}
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h4 className="text-base font-medium text-gray-900 mb-2">Manual Entry</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Enter customer&apos;s unique pass ID manually
                </p>
                <button
                  type="button"
                  onClick={() => setIsManualEntryOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Enter Pass ID
                </button>
              </div>
            </div>

            {/* Test QR Generator */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setIsTestGeneratorOpen(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <BeakerIcon className="h-4 w-4 mr-2" />
                  Generate Test QR
                </button>
                
                {/* Test Registration Link */}
                {currentProgram && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Test Client Registration:</p>
                    <a
                      href={`/loyalty/${currentProgram.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Test Registration Page
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Redemptions Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Redemptions
              </h3>
              <span className="text-sm text-gray-500">
                Last 30 days
              </span>
            </div>
            
            {recentRedemptions.length > 0 ? (
              <div className="space-y-4">
                {recentRedemptions.map((redemption) => (
                  <div key={redemption.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 bg-${redemption.color}-100 rounded-full flex items-center justify-center`}>
                        <span className={`text-${redemption.color}-600 font-medium text-sm`}>
                          {redemption.customerInitials}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{redemption.customerName}</p>
                        <p className="text-xs text-gray-500">
                          Visit {redemption.currentVisits}/{redemption.totalVisits} completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${redemption.rewardEarned ? 'text-green-600' : 'text-blue-600'}`}>
                        {redemption.rewardEarned ? 'Reward earned!' : 'Visit recorded'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(redemption.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No recent redemptions</h3>
                <p className="text-sm text-gray-500">Redemptions will appear here once customers scan their passes</p>
              </div>
            )}

            {/* View All Button */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all redemptions →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <LoyaltyProgramForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleCreateProgram}
        initialData={currentProgram ? {
          id: currentProgram.id,
          salonId: currentProgram.salonId,
          name: currentProgram.name,
          description: currentProgram.description,
          visitsRequired: currentProgram.visitsRequired,
          rewardValue: currentProgram.rewardValue,
          rewardType: currentProgram.rewardType,
          expirationDays: currentProgram.expirationDays,
          welcomeMessage: currentProgram.welcomeMessage,
          isActive: currentProgram.isActive,
          createdAt: currentProgram.createdAt,
          updatedAt: currentProgram.updatedAt
        } : undefined}
      />

      {/* QR Code Modal */}
      {currentProgram && (
        <QRCodeDisplay
          isOpen={isQRCodeOpen}
          onClose={() => setIsQRCodeOpen(false)}
          programData={currentProgram}
          salonName={salonName}
        />
      )}

      {/* Scanner Modal */}
      <QRCodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Test QR Generator Modal */}
      <TestQRGenerator
        isOpen={isTestGeneratorOpen}
        onClose={() => setIsTestGeneratorOpen(false)}
      />

      {/* Manual Entry Modal */}
      <ManualEntryModal
        isOpen={isManualEntryOpen}
        onClose={() => setIsManualEntryOpen(false)}
        onVisitRecorded={handleScanSuccess}
      />
    </div>
  )
} 