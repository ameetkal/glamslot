'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { LoyaltyProgram } from '@/types/firebase'

interface LoyaltyProgramFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (program: LoyaltyProgram) => void
  initialData?: LoyaltyProgram
}

export default function LoyaltyProgramForm({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}: LoyaltyProgramFormProps) {
  console.log('LoyaltyProgramForm rendered with isOpen:', isOpen, 'initialData:', initialData)
  
  const [formData, setFormData] = useState<LoyaltyProgram>(
    initialData || {
      visitsRequired: 5,
      rewardValue: '20',
      rewardType: 'percentage',
      expirationDays: 365,
      welcomeMessage: ''
    } as LoyaltyProgram
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
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
              {initialData ? 'Edit Loyalty Program' : 'Create Loyalty Program'}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Template Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Type
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">V</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-900">
                      Visit X times, Get Y
                    </h4>
                    <p className="text-sm text-blue-700">
                      Reward customers for repeat visits
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visits Required */}
            <div>
              <label htmlFor="visitsRequired" className="block text-sm font-medium text-gray-700 mb-2">
                Number of visits required
              </label>
              <input
                type="number"
                id="visitsRequired"
                min="1"
                max="50"
                value={formData.visitsRequired}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '') {
                    setFormData({ ...formData, visitsRequired: 0 })
                  } else {
                    const numValue = parseInt(value)
                    if (!isNaN(numValue) && numValue >= 1) {
                      setFormData({ ...formData, visitsRequired: numValue })
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Reward Type and Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rewardType" className="block text-sm font-medium text-gray-700 mb-2">
                  Reward Type
                </label>
                <select
                  id="rewardType"
                  value={formData.rewardType}
                  onChange={(e) => setFormData({ ...formData, rewardType: e.target.value as LoyaltyProgram['rewardType'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="percentage">Percentage off</option>
                  <option value="fixed">Dollar amount off</option>
                  <option value="service">Free service</option>
                </select>
              </div>
              <div>
                <label htmlFor="rewardValue" className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.rewardType === 'percentage' ? 'Percentage' : 
                   formData.rewardType === 'fixed' ? 'Dollar Amount' : 'Service'}
                </label>
                {formData.rewardType === 'service' ? (
                  <input
                    type="text"
                    id="rewardValue"
                    value={formData.rewardValue}
                    onChange={(e) => setFormData({ ...formData, rewardValue: e.target.value })}
                    placeholder="e.g., Haircut, Manicure"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <input
                    type="number"
                    id="rewardValue"
                    min="1"
                    max={formData.rewardType === 'percentage' ? '100' : '1000'}
                    value={formData.rewardValue}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '') {
                        setFormData({ ...formData, rewardValue: '' })
                      } else {
                        const numValue = parseInt(value)
                        if (!isNaN(numValue) && numValue >= 1) {
                          setFormData({ ...formData, rewardValue: value })
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>
            </div>

            {/* Expiration */}
            <div>
              <label htmlFor="expirationDays" className="block text-sm font-medium text-gray-700 mb-2">
                Program expires after (days)
              </label>
              <input
                type="number"
                id="expirationDays"
                min="30"
                max="3650"
                value={formData.expirationDays}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '') {
                    setFormData({ ...formData, expirationDays: undefined })
                  } else {
                    const numValue = parseInt(value)
                    if (!isNaN(numValue) && numValue >= 30) {
                      setFormData({ ...formData, expirationDays: numValue })
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Custom Message */}
            <div>
              <label htmlFor="welcomeMessage" className="block text-sm font-medium text-gray-700 mb-2">
                Custom message (optional)
              </label>
              <textarea
                id="welcomeMessage"
                rows={3}
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                placeholder="e.g., Thank you for being a loyal customer!"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
              <p className="text-sm text-gray-600">
                Visit {formData.visitsRequired} times, get{' '}
                {formData.rewardType === 'percentage' ? `${formData.rewardValue}% off` :
                 formData.rewardType === 'fixed' ? `$${formData.rewardValue} off` :
                 `free ${formData.rewardValue}`}
              </p>
              {formData.welcomeMessage && (
                <p className="text-sm text-gray-500 mt-1 italic">
                  "{formData.welcomeMessage}"
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Program
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
} 