'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { XMarkIcon, CameraIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ScannedLoyaltyData {
  type: 'loyalty'
  salon: string
  program: {
    visitsRequired: number
    reward: string
    rewardType: 'percentage' | 'dollar' | 'free'
    customMessage?: string
  }
  timestamp: string
  customerId?: string
  currentVisits?: number
}

interface QRCodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScanSuccess: (data: ScannedLoyaltyData) => void
}

export default function QRCodeScanner({ 
  isOpen, 
  onClose, 
  onScanSuccess 
}: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScannedLoyaltyData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleScanSuccess = useCallback((decodedText: string) => {
    try {
      const parsedData = JSON.parse(decodedText) as ScannedLoyaltyData
      
      // Validate the scanned data
      if (parsedData.type === 'loyalty' && parsedData.program) {
        setScanResult(parsedData)
        stopScanner()
      } else {
        setError('Invalid loyalty program QR code')
      }
    } catch (err) {
      console.error('Error parsing QR code data:', err)
      setError('Invalid QR code format')
    }
  }, [])

  const startScanner = useCallback(() => {
    if (!containerRef.current) return

    try {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      )

      scannerRef.current.render(
        (decodedText) => {
          handleScanSuccess(decodedText)
        },
        (errorMessage) => {
          // Ignore scanning errors, they're normal during scanning
          console.log('Scanning in progress...', errorMessage)
        }
      )

      setIsScanning(true)
      setError(null)
    } catch (err) {
      console.error('Error starting scanner:', err)
      setError('Failed to start camera. Please check camera permissions.')
    }
  }, [handleScanSuccess])

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      startScanner()
    }

    return () => {
      if (scannerRef.current) {
        stopScanner()
      }
    }
  }, [isOpen, startScanner])

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  const handleConfirmScan = () => {
    if (scanResult) {
      onScanSuccess(scanResult)
      onClose()
    }
  }

  const handleRetry = () => {
    setScanResult(null)
    setError(null)
    startScanner()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Scan Customer Pass
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!scanResult && !error && (
              <div className="space-y-4">
                <div className="text-center">
                  <CameraIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Point your camera at the customer&apos;s loyalty pass QR code
                  </p>
                </div>
                
                {/* Scanner container */}
                <div 
                  id="qr-reader" 
                  ref={containerRef}
                  className="w-full"
                />
                
                {isScanning && (
                  <div className="text-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                      Scanning...
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Scan Result */}
            {scanResult && (
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Pass Scanned Successfully!
                  </h4>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <h5 className="font-medium text-gray-900">{scanResult.salon}</h5>
                    <p className="text-sm text-gray-600">
                      Visit {scanResult.program.visitsRequired} times, get{' '}
                      {scanResult.program.rewardType === 'percentage' ? `${scanResult.program.reward}% off` :
                       scanResult.program.rewardType === 'dollar' ? `$${scanResult.program.reward} off` :
                       `free ${scanResult.program.reward}`}
                    </p>
                  </div>
                  
                  {scanResult.program.customMessage && (
                    <p className="text-sm text-gray-500 italic">
                      &quot;{scanResult.program.customMessage}&quot;
                    </p>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    <p>Current visits: {scanResult.currentVisits || 0} / {scanResult.program.visitsRequired}</p>
                    <p>Scanned: {new Date(scanResult.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Scan Again
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmScan}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Confirm Visit
                  </button>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="space-y-4">
                <div className="text-center">
                  <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Scan Error
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {error}
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 