'use client'

import { useState } from 'react'
import { getAvailableRoles, getRoleDefinition, getPermissionsForRole } from '@/lib/permissions'
import { TeamMemberPermissions } from '@/types/firebase'
import { 
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function RolesPage() {
  const [expandedRoles, setExpandedRoles] = useState<{ [key: string]: boolean }>({})
  const availableRoles = getAvailableRoles()

  const toggleRole = (roleValue: string) => {
    setExpandedRoles(prev => ({
      ...prev,
      [roleValue]: !prev[roleValue]
    }))
  }

  const renderPermissions = (permissions: TeamMemberPermissions) => {
    const permissionGroups = [
      {
        title: 'Dashboard Access',
        permissions: [
          { key: 'canViewRequests', label: 'View Requests' },
          { key: 'canManageRequests', label: 'Manage Requests' },
          { key: 'canViewClients', label: 'View Clients' },
          { key: 'canManageClients', label: 'Manage Clients' },
          { key: 'canViewLoyalty', label: 'View Loyalty' },
          { key: 'canManageLoyalty', label: 'Manage Loyalty' },
        ]
      },
      {
        title: 'Settings Access',
        permissions: [
          { key: 'canViewSettings', label: 'View Settings' },
          { key: 'canManageServices', label: 'Manage Services' },
          { key: 'canManageProviders', label: 'Manage Providers' },
          { key: 'canManageNotifications', label: 'Manage Notifications' },
          { key: 'canManageTeam', label: 'Manage Team' },
          { key: 'canManageSalon', label: 'Manage Salon' },
        ]
      },
      {
        title: 'Admin Access',
        permissions: [
          { key: 'canViewAnalytics', label: 'View Analytics' },
          { key: 'canManageBilling', label: 'Manage Billing' },
          { key: 'canAccessAdmin', label: 'Access Admin' },
        ]
      },
      {
        title: 'Provider Access',
        permissions: [
          { key: 'canManageOwnSchedule', label: 'Manage Own Schedule' },
          { key: 'canViewOwnBookings', label: 'View Own Bookings' },
          { key: 'canManageOwnServices', label: 'Manage Own Services' },
        ]
      }
    ]

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {permissionGroups.map((group) => (
            <div key={group.title}>
              <h5 className="text-sm font-medium text-gray-700 mb-3">{group.title}</h5>
              <div className="space-y-2">
                {group.permissions.map((permission) => (
                  <div key={permission.key} className="flex items-center text-sm">
                    {permissions[permission.key as keyof TeamMemberPermissions] ? (
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XMarkIcon className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className={permissions[permission.key as keyof TeamMemberPermissions] ? 'text-green-700' : 'text-red-700'}>
                      {permission.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/settings/admin"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Team Management
          </Link>
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Role Permissions</h1>
              <p className="mt-1 text-sm text-gray-700">
                Detailed overview of all available roles and their permissions
              </p>
            </div>
          </div>
        </div>

        {/* All Roles */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Available Roles</h3>
            <p className="mt-1 text-sm text-gray-700">
              Click on any role to view its detailed permissions
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {availableRoles.map((role) => {
                const roleDef = getRoleDefinition(role.value)
                const permissions = getPermissionsForRole(role.value)
                const enabledPermissions = Object.values(permissions).filter(Boolean).length
                const totalPermissions = Object.keys(permissions).length
                const isExpanded = expandedRoles[role.value]
                
                return (
                  <div 
                    key={role.value}
                    className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => toggleRole(role.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleDef.color}`}>
                            {roleDef.name}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{roleDef.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {enabledPermissions} of {totalPermissions} permissions enabled
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {isExpanded ? 'Hide' : 'Show'} details
                          </span>
                          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Permissions Section */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <div className="pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Permissions</h4>
                          {renderPermissions(permissions)}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 