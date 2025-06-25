'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { QrCodeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface TestQRGeneratorProps {
  isOpen: boolean
  onClose: () => void
}

export default function TestQRGenerator({ isOpen, onClose }: TestQRGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [testData, setTestData] = useState({
    salonName: 'Test Salon',
    visitsRequired: 5,
    reward: '20',
    rewardType: 'percentage' as const,
    customMessage: 'Thank you for being a loyal customer!',
    currentVisits: 2
  })

  // Auto-generate QR code when modal opens
  useEffect(() => {
    if (isOpen && !qrCodeDataUrl) {
      generateTestQR()
    }
  }, [isOpen])

  const generateTestQR = async () => {
    setIsGenerating(true)
    console.log('Generating test QR code with data:', testData)
    
    try {
      const loyaltyData = {
        type: 'loyalty' as const,
        salon: testData.salonName,
        program: {
          visitsRequired: testData.visitsRequired,
          reward: testData.reward,
          rewardType: testData.rewardType,
          customMessage: testData.customMessage
        },
        timestamp: new Date().toISOString(),
        programId: `test-${Date.now()}`,
        customerId: 'test-customer-123',
        currentVisits: testData.currentVisits
      }

      console.log('Test loyalty data:', loyaltyData)

      const qrText = JSON.stringify(loyaltyData)
      console.log('Test QR text:', qrText)
      
      const qrDataUrl = await QRCode.toDataURL(qrText, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
      
      console.log('Test QR code generated:', qrDataUrl.substring(0, 50) + '...')
      setQrCodeDataUrl(qrDataUrl)
    } catch (error) {
      console.error('Error generating test QR code:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a')
      link.download = `test-loyalty-program.png`
      link.href = qrCodeDataUrl
      link.click()
    }
  }

  if (!isOpen) return null

  console.log('TestQRGenerator rendering - isOpen:', isOpen, 'qrCodeDataUrl:', qrCodeDataUrl ? 'exists' : 'none', 'isGenerating:', isGenerating)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Generate Test QR Code
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={onClose}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Test Data Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salon Name
                  </label>
                  <input
                    type="text"
                    value={testData.salonName}
                    onChange={(e) => {
                      setTestData({ ...testData, salonName: e.target.value })
                      setQrCodeDataUrl('') // Clear QR code to regenerate
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visits Required
                  </label>
                  <input
                    type="number"
                    value={testData.visitsRequired}
                    onChange={(e) => {
                      setTestData({ ...testData, visitsRequired: parseInt(e.target.value) || 1 })
                      setQrCodeDataUrl('') // Clear QR code to regenerate
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Visits
                  </label>
                  <input
                    type="number"
                    value={testData.currentVisits}
                    onChange={(e) => {
                      setTestData({ ...testData, currentVisits: parseInt(e.target.value) || 0 })
                      setQrCodeDataUrl('') // Clear QR code to regenerate
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reward (%)
                  </label>
                  <input
                    type="number"
                    value={testData.reward}
                    onChange={(e) => {
                      setTestData({ ...testData, reward: e.target.value })
                      setQrCodeDataUrl('') // Clear QR code to regenerate
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Message
                </label>
                <input
                  type="text"
                  value={testData.customMessage}
                  onChange={(e) => {
                    setTestData({ ...testData, customMessage: e.target.value })
                    setQrCodeDataUrl('') // Clear QR code to regenerate
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={generateTestQR}
                disabled={isGenerating}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <QrCodeIcon className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Test QR Code'}
              </button>

              {/* Generated QR Code */}
              {qrCodeDataUrl && (
                <div className="text-center space-y-4">
                  <div className="w-48 h-48 mx-auto bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <img 
                      src={qrCodeDataUrl} 
                      alt="Test QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-2">
                    <p><strong>Test Data:</strong></p>
                    <p>{testData.salonName} - Visit {testData.visitsRequired} times, get {testData.reward}% off</p>
                    <p>Current visits: {testData.currentVisits} / {testData.visitsRequired}</p>
                  </div>

                  <button
                    type="button"
                    onClick={downloadQRCode}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Download Test QR Code
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modal actions */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 