import { TeamMemberPermissions, RoleDefinition } from '@/types/firebase'

// Default permissions for each role
export const ROLE_PERMISSIONS: Record<string, TeamMemberPermissions> = {
  admin: {
    // Dashboard Access - Full access to salon
    canViewRequests: true,
    canManageRequests: true,
    canViewClients: true,
    canManageClients: true,
    canViewLoyalty: true,
    canManageLoyalty: true,
    
    // Settings Access - Full access to salon
    canViewSettings: true,
    canManageServices: true,
    canManageProviders: true,
    canManageNotifications: true,
    canManageTeam: true,
    canManageSalon: true,
    
    // Admin Access - Full access to salon
    canViewAnalytics: true,
    canManageBilling: true,
    canAccessAdmin: true,
    
    // Provider-specific permissions - Full access
    canManageOwnSchedule: true,
    canViewOwnBookings: true,
    canManageOwnServices: true,
  },
  
  service_provider: {
    // Dashboard Access - Limited to own work
    canViewRequests: true, // Can view their own bookings as "Requests"
    canManageRequests: false,
    canViewClients: false,
    canManageClients: false,
    canViewLoyalty: false,
    canManageLoyalty: false,
    
    // Settings Access - Own schedule and services only
    canViewSettings: false,
    canManageServices: false,
    canManageProviders: false,
    canManageNotifications: false,
    canManageTeam: false,
    canManageSalon: false,
    
    // Admin Access - None
    canViewAnalytics: false,
    canManageBilling: false,
    canAccessAdmin: false,
    
    // Provider-specific permissions - Full access to own work
    canManageOwnSchedule: true,
    canViewOwnBookings: true,
    canManageOwnServices: true,
  },
}

// Role definitions with descriptions and colors
export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  admin: {
    name: 'Admin',
    description: 'Full access to all features and team management',
    permissions: ROLE_PERMISSIONS.admin,
    color: 'bg-purple-100 text-purple-800',
  },
  service_provider: {
    name: 'Service Provider',
    description: 'Manage own schedule, services, and view own bookings',
    permissions: ROLE_PERMISSIONS.service_provider,
    color: 'bg-orange-100 text-orange-800',
  },
}

// Helper function to get permissions for a role
export function getPermissionsForRole(role: string): TeamMemberPermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.service_provider
}

// Helper function to check if a user has a specific permission
export function hasPermission(
  userPermissions: TeamMemberPermissions | undefined,
  permission: keyof TeamMemberPermissions
): boolean {
  if (!userPermissions) return false
  return userPermissions[permission] || false
}

// Helper function to get role definition
export function getRoleDefinition(role: string): RoleDefinition {
  return ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.service_provider
}

// Helper function to get all available roles
export function getAvailableRoles(): Array<{ value: string; label: string; description: string }> {
  return Object.entries(ROLE_DEFINITIONS).map(([value, definition]) => ({
    value,
    label: definition.name,
    description: definition.description,
  }))
} 