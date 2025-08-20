'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { Salon, ConsultationFormField } from '@/types/firebase'
import { salonService } from '@/lib/firebase/services'

interface VirtualConsultationCardProps {
  consultationUrl?: string
  className?: string
  salonData?: Salon | null
  onSalonUpdate?: (updatedSalon: Salon) => void
}

// Default consultation form fields
const createDefaultFields = (): ConsultationFormField[] => [
  {
    id: 'service-type',
    type: 'select',
    label: 'Service Type',
    required: true,
    options: ['Hair Color', 'Extensions', 'Chemical Treatment', 'Cut & Style', 'Other'],
    order: 1
  },
  {
    id: 'current-hair',
    type: 'select',
    label: 'How long is your hair?',
    required: true,
    options: ['Short', 'Medium', 'Long'],
    order: 2
  },

  {
    id: 'hair-photo-top',
    type: 'file',
    label: 'Hair Photos - Roots View',
    required: true,
    accept: 'image/*,video/*',
    order: 3
  },

  {
    id: 'hair-photo-sides',
    type: 'file',
    label: 'Hair Photos - Side View',
    required: true,
    accept: 'image/*,video/*',
    order: 4
  },
  {
    id: 'desired-result',
    type: 'file',
    label: 'Inspo Photo (Desired Result)',
    placeholder: 'What look are you hoping to achieve?',
    required: true,
    order: 5
  },
  {
    id: 'additional-notes',
    type: 'textarea',
    label: 'Additional Notes',
    placeholder: 'Previous treatments, allergies, hair history, or other information we should know',
    required: false,
    order: 6
  },
  {
    id: 'name',
    type: 'text',
    label: 'Full Name',
    placeholder: 'Enter your full name',
    required: true,
    order: 7
  },
  {
    id: 'email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'your.email@example.com',
    required: false,
    order: 8
  },
  {
    id: 'phone',
    type: 'phone',
    label: 'Phone Number',
    placeholder: '(555) 123-4567',
    required: true,
    order: 9
  },
]

export default function VirtualConsultationCard({ 
  consultationUrl, 
  className = '',
  salonData,
  onSalonUpdate
}: VirtualConsultationCardProps) {
  const [showFormBuilder, setShowFormBuilder] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  
  // Get current form fields or use defaults
  const currentFields = salonData?.consultationForm?.fields || createDefaultFields()
  const [formFields, setFormFields] = useState<ConsultationFormField[]>(currentFields)

  const handleVisit = () => {
    if (consultationUrl) {
      window.open(consultationUrl, '_blank')
    }
  }

  const handleSaveForm = async () => {
    if (!salonData?.id) return

    setSaving(true)
    try {
      // Sort fields by order
      const sortedFields = [...formFields].sort((a, b) => a.order - b.order)
      
      const consultationForm = {
        fields: sortedFields,
        submitButtonText: 'Submit Consultation Request',
        successMessage: 'Thank you! We\'ll review your consultation request and contact you soon.'
      }

      // Update salon with consultation form
      const updatedSalon = {
        ...salonData,
        consultationForm
      }

      await salonService.updateSalon(salonData.id, { consultationForm })
      
      if (onSalonUpdate) {
        onSalonUpdate(updatedSalon)
      }
      
      // Show save success message
      setSuccess('Consultation form saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error saving consultation form:', error)
      alert('Failed to save consultation form')
    } finally {
      setSaving(false)
    }
  }

  const handleAddField = () => {
    const newField: ConsultationFormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false,
      order: Math.max(...formFields.map(f => f.order)) + 1
    }
    setFormFields([...formFields, newField])
  }

  const handleDeleteField = (fieldId: string) => {
    setFormFields(formFields.filter(f => f.id !== fieldId))
  }

  const handleFieldChangeInBuilder = (fieldId: string, updates: Partial<ConsultationFormField>) => {
    setFormFields(formFields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
  }

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const sortedFields = [...formFields].sort((a, b) => a.order - b.order)
    const currentIndex = sortedFields.findIndex(f => f.id === fieldId)
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sortedFields.length - 1)
    ) {
      return
    }
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const updatedFields = [...sortedFields]
    
    // Swap the fields
    const temp = updatedFields[currentIndex]
    updatedFields[currentIndex] = updatedFields[newIndex]
    updatedFields[newIndex] = temp
    
    // Update order values
    updatedFields.forEach((field, index) => {
      field.order = index + 1
    })
    
    setFormFields(updatedFields)
  }

  const handleConditionalToggle = (fieldId: string, enabled: boolean) => {
    if (enabled) {
      // Initialize conditional rules for this field
      const field = formFields.find(f => f.id === fieldId)
      if (field && field.options) {
        const conditionalRules = field.options.map(option => ({
          triggerValue: option,
          showFields: []
        }))
        
        setFormFields(formFields.map(f => 
          f.id === fieldId 
            ? { ...f, conditionalRules }
            : f
        ))
      }
    } else {
      // Remove conditional rules and mark conditional fields as regular
      const updatedFields = formFields.map(f => {
        if (f.id === fieldId) {
          return { ...f, conditionalRules: undefined }
        }
        if (f.parentFieldId === fieldId) {
          return { ...f, isConditional: false, parentFieldId: undefined }
        }
        return f
      })
      setFormFields(updatedFields)
    }
  }

  const addConditionalField = (parentFieldId: string, triggerValue: string) => {
    const newField: ConsultationFormField = {
      id: `conditional-${Date.now()}`,
      type: 'text',
      label: 'New conditional question',
      required: false,
      order: Math.max(...formFields.map(f => f.order)) + 1,
      isConditional: true,
      parentFieldId
    }
    
    // Add the new field and update the conditional rule in one operation
    setFormFields(currentFields => {
      const fieldsWithNewField = [...currentFields, newField]
      
      return fieldsWithNewField.map(f => {
        if (f.id === parentFieldId && f.conditionalRules) {
          const updatedRules = f.conditionalRules.map(rule => 
            rule.triggerValue === triggerValue
              ? { ...rule, showFields: [...rule.showFields, newField.id] }
              : rule
          )
          return { ...f, conditionalRules: updatedRules }
        }
        return f
      })
    })
  }

  const removeConditionalField = (parentFieldId: string, triggerValue: string, fieldId: string) => {
    // Remove the field and update the conditional rule in one operation
    setFormFields(currentFields => {
      // First remove the field from conditional rules and then filter out the field
      const fieldsWithUpdatedRules = currentFields.map(f => {
        if (f.id === parentFieldId && f.conditionalRules) {
          const updatedRules = f.conditionalRules.map(rule => 
            rule.triggerValue === triggerValue
              ? { ...rule, showFields: rule.showFields.filter(id => id !== fieldId) }
              : rule
          )
          return { ...f, conditionalRules: updatedRules }
        }
        return f
      })
      
      // Then remove the conditional field entirely
      return fieldsWithUpdatedRules.filter(f => f.id !== fieldId)
    })
  }

  if (!consultationUrl) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Virtual Consultation URL</h3>
        <div className="text-sm text-gray-500">Loading consultation URL...</div>
      </div>
    )
  }

  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Virtual Consultation URL</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="text"
              readOnly
              value={consultationUrl}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
            />
            <button
              type="button"
              onClick={handleVisit}
              className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors rounded-md whitespace-nowrap"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Visit
            </button>
          </div>
        </div>

        {/* Customize Form Button */}
        <div className="mb-4">
          <button
            onClick={() => setShowFormBuilder(!showFormBuilder)}
            className="flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
          >
            Customize Form
            {showFormBuilder ? (
              <ChevronUpIcon className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 ml-1" />
            )}
          </button>
        </div>

        {/* Form Builder Section */}
        {showFormBuilder && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-900">Form Fields</h4>
              <button
                onClick={handleAddField}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-500"
              >
                <PlusIcon className="w-3 h-3 mr-1" />
                Add Field
              </button>
            </div>
            
            {/* Form Fields List */}
            <div className="space-y-2">
              {[...formFields]
                .filter(field => !field.isConditional) // Don't show conditional fields in main list
                .sort((a, b) => a.order - b.order)
                .map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Bars3Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{field.label}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {field.type}
                      </span>
                      {field.required && (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          Required
                        </span>
                      )}
                      {field.isConditional && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          Conditional
                        </span>
                      )}
                      {field.parentFieldId && (
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                          ↳ Depends on: {formFields.find(f => f.id === field.parentFieldId)?.label || 'Unknown'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveField(field.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveField(field.id, 'down')}
                        disabled={index === formFields.filter(f => !f.isConditional).length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Quick Edit Controls */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => handleFieldChangeInBuilder(field.id, { label: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-gray-900"
                      placeholder="Field label"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => handleFieldChangeInBuilder(field.id, { type: e.target.value as ConsultationFormField['type'] })}
                      className="px-2 py-1 border border-gray-300 rounded text-gray-900"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Select</option>
                      <option value="file">File Upload</option>
                    </select>
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => handleFieldChangeInBuilder(field.id, { placeholder: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-gray-900"
                      placeholder="Placeholder text"
                    />
                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => handleFieldChangeInBuilder(field.id, { required: e.target.checked })}
                        className="rounded"
                      />
                      <span>Required</span>
                    </label>
                  </div>
                  
                  {/* Select Options */}
                  {field.type === 'select' && (
                    <div className="mt-2 space-y-3">
                      <textarea
                        value={(field.options || []).join('\n')}
                        onChange={(e) => handleFieldChangeInBuilder(field.id, { 
                          options: e.target.value.split('\n').filter(opt => opt.trim()) 
                        })}
                        placeholder="Enter options (one per line)"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                        rows={3}
                      />
                      
                      {/* Conditional Logic Toggle */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`conditional-${field.id}`}
                          checked={Boolean(field.conditionalRules && field.conditionalRules.length > 0)}
                          onChange={(e) => handleConditionalToggle(field.id, e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor={`conditional-${field.id}`} className="text-xs text-gray-700">
                          Add conditional questions
                        </label>
                      </div>
                      
                      {/* Conditional Fields Display */}
                      {field.conditionalRules && field.conditionalRules.length > 0 && (
                        <div className="border-t border-gray-200 pt-2 space-y-2">
                          <h5 className="text-xs font-medium text-gray-900">Conditional Questions:</h5>
                          {field.options?.map((option) => (
                            <div key={option} className="border border-gray-200 rounded p-2">
                              <div className="text-xs font-medium text-gray-700 mb-2">
                                When &quot;{option}&quot; is selected:
                              </div>
                              <div className="space-y-2">
                                {field.conditionalRules?.find(rule => rule.triggerValue === option)?.showFields.map((fieldId) => {
                                  const conditionalField = formFields.find(f => f.id === fieldId);
                                  return conditionalField ? (
                                    <div key={fieldId} className="ml-4 border-l-2 border-blue-200 pl-3">
                                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                              Conditional
                                            </span>
                                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                              ↳ {option}
                                            </span>
                                          </div>
                                          <button
                                            onClick={() => removeConditionalField(field.id, option, fieldId)}
                                            className="p-1 text-red-400 hover:text-red-600"
                                          >
                                            <TrashIcon className="w-3 h-3" />
                                          </button>
                                        </div>
                                        
                                        {/* Conditional Field Editing Interface */}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <input
                                            type="text"
                                            value={conditionalField.label}
                                            onChange={(e) => handleFieldChangeInBuilder(conditionalField.id, { label: e.target.value })}
                                            className="px-2 py-1 border border-gray-300 rounded text-gray-900"
                                            placeholder="Field label"
                                          />
                                          <select
                                            value={conditionalField.type}
                                            onChange={(e) => handleFieldChangeInBuilder(conditionalField.id, { type: e.target.value as ConsultationFormField['type'] })}
                                            className="px-2 py-1 border border-gray-300 rounded text-gray-900"
                                          >
                                            <option value="text">Text</option>
                                            <option value="email">Email</option>
                                            <option value="phone">Phone</option>
                                            <option value="textarea">Textarea</option>
                                            <option value="select">Select</option>
                                            <option value="file">File Upload</option>
                                          </select>
                                          <input
                                            type="text"
                                            value={conditionalField.placeholder || ''}
                                            onChange={(e) => handleFieldChangeInBuilder(conditionalField.id, { placeholder: e.target.value })}
                                            className="px-2 py-1 border border-gray-300 rounded text-gray-900"
                                            placeholder="Placeholder text"
                                          />
                                          <label className="flex items-center space-x-1">
                                            <input
                                              type="checkbox"
                                              checked={conditionalField.required}
                                              onChange={(e) => handleFieldChangeInBuilder(conditionalField.id, { required: e.target.checked })}
                                              className="rounded"
                                            />
                                            <span>Required</span>
                                          </label>
                                        </div>
                                        
                                        {/* Select Options for Conditional Select Fields */}
                                        {conditionalField.type === 'select' && (
                                          <div className="mt-2">
                                            <textarea
                                              value={(conditionalField.options || []).join('\n')}
                                              onChange={(e) => handleFieldChangeInBuilder(conditionalField.id, { 
                                                options: e.target.value.split('\n').filter(opt => opt.trim()) 
                                              })}
                                              placeholder="Enter options (one per line)"
                                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                                              rows={2}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : null;
                                })}
                                <button
                                  onClick={() => addConditionalField(field.id, option)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  + Add Question
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setShowFormBuilder(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveForm}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving Form...' : 'Save Form'}
              </button>
            </div>
            
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}