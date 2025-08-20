'use client'

import { useState, useEffect } from 'react'
import { SwatchIcon } from '@heroicons/react/24/outline'

interface ColorPickerProps {
  currentColor?: string
  onColorChange: (color: string) => void
  className?: string
}

// Professional salon color palette
const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#1E40AF', // Dark Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#059669', // Dark Green
  '#6B7280', // Gray
  '#374151', // Dark Gray
  '#000000', // Black
  '#FFFFFF', // White
]

export default function ColorPicker({ 
  currentColor = '#3B82F6', 
  onColorChange, 
  className = '' 
}: ColorPickerProps) {
  const [color, setColor] = useState(currentColor)
  const [hexInput, setHexInput] = useState(currentColor)
  const [error, setError] = useState('')

  useEffect(() => {
    setColor(currentColor)
    setHexInput(currentColor)
  }, [currentColor])

  const validateHexColor = (hex: string): boolean => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    return hexRegex.test(hex)
  }

  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    setHexInput(newColor)
    setError('')
    onColorChange(newColor)
  }

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setHexInput(value)
    setError('')

    // If it's a valid hex color, update the color
    if (validateHexColor(value)) {
      setColor(value)
      onColorChange(value)
    }
  }

  const handleHexInputBlur = () => {
    if (!validateHexColor(hexInput)) {
      setError('❌ Please enter a valid hex color code (e.g., #3B82F6, #FF0000)')
      setHexInput(color) // Revert to last valid color
    }
  }

  const handleHexInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Color
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Choose your salon&apos;s primary color for branding
        </p>
      </div>

      {/* Color Picker and Hex Input */}
      <div className="flex items-center space-x-4">
        {/* HTML5 Color Input */}
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
            title="Click to open color picker"
          />
          <SwatchIcon className="h-5 w-5 text-gray-400" />
        </div>

        {/* Hex Input */}
        <div className="flex-1">
          <input
            type="text"
            value={hexInput}
            onChange={handleHexInputChange}
            onBlur={handleHexInputBlur}
            onKeyPress={handleHexInputKeyPress}
            placeholder="#3B82F6"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
          />
        </div>
      </div>

      {/* Preset Colors */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Quick Select:</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              type="button"
              onClick={() => handleColorChange(presetColor)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                color === presetColor 
                  ? 'border-gray-900 scale-110' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: presetColor }}
              title={presetColor}
            />
          ))}
        </div>
      </div>

      {/* Contrast Preview */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Text Contrast Preview:</p>
        <div 
          className="p-4 rounded-lg border border-gray-200"
          style={{ backgroundColor: color }}
        >
          <p className="text-black font-medium">Sample Form Text</p>
          <p className="text-black text-sm opacity-80">This shows how black text will look on your selected background color.</p>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}
