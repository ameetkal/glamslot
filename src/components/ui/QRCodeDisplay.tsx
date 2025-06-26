'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, QrCodeIcon } from '@heroicons/react/24/outline'
import QRCode from 'qrcode'
import { LoyaltyProgram } from '@/types/firebase'

interface QRCodeDisplayProps {
  isOpen: boolean
  onClose: () => void
  programData: LoyaltyProgram
  salonName: string
}

export default function QRCodeDisplay({ 
  isOpen, 
  onClose, 
  programData, 
  salonName 
}: QRCodeDisplayProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateQRCode = async () => {
    setIsGenerating(true)
    try {
      // Create the registration URL
      const registrationUrl = `${window.location.origin}/loyalty/${programData.id}`
      
      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(registrationUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      setQrCodeDataUrl(qrDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (isOpen && programData) {
      generateQRCode()
    }
  }, [isOpen, programData])

  if (!isOpen) return null

  const rewardText = programData.rewardType === 'percentage' 
    ? `${programData.rewardValue}% off`
    : programData.rewardType === 'fixed'
    ? `$${programData.rewardValue} off`
    : programData.rewardValue

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
              Loyalty Program QR Code
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 p-1"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Program Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                {salonName} Loyalty Program
              </h4>
              <p className="text-sm text-blue-700">
                Visit {programData.visitsRequired} times, get {rewardText}
              </p>
            </div>

            {/* QR Code */}
            <div className="text-center">
              {isGenerating ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">Generating QR code...</span>
                </div>
              ) : qrCodeDataUrl ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
                    <img 
                      src={qrCodeDataUrl} 
                      alt="Loyalty Program QR Code" 
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Customers can scan this QR code to join your loyalty program
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <QrCodeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Failed to generate QR code</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">How it works:</h4>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Customers scan this QR code with their phone</li>
                <li>2. They enter their name, email, and phone number</li>
                <li>3. A loyalty pass is created and added to their wallet</li>
                <li>4. Staff can scan the pass to record visits</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
              <button
                type="button"
                onClick={generateQRCode}
                disabled={isGenerating}
                className="px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Regenerate QR
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 