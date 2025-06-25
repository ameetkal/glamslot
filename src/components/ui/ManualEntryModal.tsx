'use client'

import { useState } from 'react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface CustomerData {
  customerId: string
  customerName: string
  customerInitials: string
  currentVisits: number
  totalVisits: number
  program: {
    visitsRequired: number
    reward: string
    rewardType: string
  }
  salon: string
}

interface ManualEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onVisitRecorded: (customerData: CustomerData) => void
}

export default function ManualEntryModal({ 
  isOpen, 
  onClose, 
  onVisitRecorded 
}: ManualEntryModalProps) {
  const [passId, setPassId] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<CustomerData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!passId.trim()) {
      setError('Please enter a pass ID')
      return
    }

    setIsSearching(true)
    setError(null)
    setSearchResult(null)

    try {
      // TODO: Replace with actual API call to validate pass ID
      // For now, simulate a search with mock data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock validation - in real app, this would check against database
      const mockCustomerData = {
        customerId: passId,
        customerName: 'John Doe',
        customerInitials: 'JD',
        currentVisits: 3,
        totalVisits: 5,
        program: {
          visitsRequired: 5,
          reward: '20',
          rewardType: 'percentage'
        },
        salon: 'Test Salon'
      }

      setSearchResult(mockCustomerData)
    } catch {
      setError('Pass ID not found. Please check and try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleRecordVisit = () => {
    if (searchResult) {
      onVisitRecorded(searchResult)
      onClose()
      // Reset form
      setPassId('')
      setSearchResult(null)
      setError(null)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset form
    setPassId('')
    setSearchResult(null)
    setError(null)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Manual Pass Entry
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 p-1"
              onClick={handleClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Pass ID Input */}
            <div>
              <label htmlFor="passId" className="block text-sm font-medium text-gray-700 mb-2">
                Customer Pass ID
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="passId"
                  value={passId}
                  onChange={(e) => setPassId(e.target.value)}
                  placeholder="Enter pass ID (e.g., CUST-12345)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching || !passId.trim()}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Loading State */}
            {isSearching && (
              <div className="text-center py-8">
                <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Searching for customer...
                </div>
              </div>
            )}

            {/* Search Result */}
            {searchResult && !isSearching && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-medium text-sm">
                        {searchResult.customerInitials}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {searchResult.customerName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Pass ID: {searchResult.customerId}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current visits:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {searchResult.currentVisits} / {searchResult.totalVisits}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Program:</span>
                    <span className="text-sm font-medium text-gray-900">
                      Visit {searchResult.program.visitsRequired} times, get {searchResult.program.reward}% off
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Next visit will:</span>
                    <span className={`text-sm font-medium ${searchResult.currentVisits + 1 >= searchResult.totalVisits ? 'text-green-600' : 'text-blue-600'}`}>
                      {searchResult.currentVisits + 1 >= searchResult.totalVisits ? 'Earn reward!' : 'Record visit'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRecordVisit}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Record Visit
                </button>
              </div>
            )}

            {/* Instructions */}
            {!searchResult && !isSearching && (
              <div className="text-sm text-gray-600 space-y-2">
                <p className="font-medium text-gray-900">How to find the Pass ID:</p>
                <ul className="space-y-1">
                  <li>• Ask customer to show their Apple Wallet pass</li>
                  <li>• Look for the unique ID at the bottom of the pass</li>
                  <li>• Or ask customer to check their email for the pass ID</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 