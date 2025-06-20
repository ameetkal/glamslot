import React from 'react'
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingStorefrontIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ComponentType<{ className?: string }>
  error?: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  error?: string
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

// Universal Input Component with proper contrast
export const Input: React.FC<InputProps> = ({ 
  label, 
  icon: Icon, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          {...props}
          className={`
            block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 
            bg-white text-gray-900 placeholder-gray-600
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
            ${className}
          `}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

// Universal Select Component
export const Select: React.FC<SelectProps> = ({ 
  label, 
  options, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`
          block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 
          bg-white text-gray-900
          focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

// Universal Button Component
export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  loading, 
  icon: Icon, 
  children, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  
  const variantClasses = {
    primary: "border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    secondary: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500",
    danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500"
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      )}
      {Icon && !loading && (
        <Icon className="h-4 w-4 mr-2" />
      )}
      {children}
    </button>
  )
}

// Pre-configured input components for common use cases
export const NameInput: React.FC<Omit<InputProps, 'icon'> & { icon?: React.ComponentType<{ className?: string }> }> = (props) => (
  <Input icon={props.icon || UserIcon} placeholder="Enter name" {...props} />
)

export const EmailInput: React.FC<Omit<InputProps, 'icon'> & { icon?: React.ComponentType<{ className?: string }> }> = (props) => (
  <Input icon={props.icon || EnvelopeIcon} type="email" placeholder="Enter email address" {...props} />
)

export const PhoneInput: React.FC<Omit<InputProps, 'icon'> & { icon?: React.ComponentType<{ className?: string }> }> = (props) => (
  <Input icon={props.icon || PhoneIcon} type="tel" placeholder="Enter phone number" {...props} />
)

export const BusinessNameInput: React.FC<Omit<InputProps, 'icon'> & { icon?: React.ComponentType<{ className?: string }> }> = (props) => (
  <Input icon={props.icon || BuildingStorefrontIcon} placeholder="Enter business name" {...props} />
)

export const SearchInput: React.FC<Omit<InputProps, 'icon'> & { icon?: React.ComponentType<{ className?: string }> }> = (props) => (
  <Input icon={props.icon || MagnifyingGlassIcon} placeholder="Search..." {...props} />
)

export const UrlInput: React.FC<Omit<InputProps, 'icon'> & { icon?: React.ComponentType<{ className?: string }> }> = (props) => (
  <Input icon={props.icon || GlobeAltIcon} type="url" placeholder="Enter URL" {...props} />
) 