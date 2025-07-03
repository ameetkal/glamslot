import { TeamMemberPermissions, RoleDefinition } from '@/types/firebase'

// Default permissions for each role
export const ROLE_PERMISSIONS: Record<string, TeamMemberPermissions> = {
  owner: {
    // Dashboard Access - Full access
    canViewRequests: true,
    canManageRequests: true,
    canViewClients: true,
    canManageClients: true,
    canViewLoyalty: true,
    canManageLoyalty: true,
    
    // Settings Access - Full access
    canViewSettings: true,
    canManageServices: true,
    canManageProviders: true,
    canManageNotifications: true,
    canManageTeam: true,
    canManageSalon: true,
    
    // Admin Access - Full access
    canViewAnalytics: true,
    canManageBilling: true,
    canAccessAdmin: true,
    
    // Provider-specific permissions
    canManageOwnSchedule: true,
    canViewOwnBookings: true,
    canManageOwnServices: true,
  },
  
  admin: {
    // Dashboard Access - Full access
    canViewRequests: true,
    canManageRequests: true,
    canViewClients: true,
    canManageClients: true,
    canViewLoyalty: true,
    canManageLoyalty: true,
    
    // Settings Access - Full access except team management
    canViewSettings: true,
    canManageServices: true,
    canManageProviders: true,
    canManageNotifications: true,
    canManageTeam: false, // Only owner can manage team
    canManageSalon: true,
    
    // Admin Access - Limited
    canViewAnalytics: true,
    canManageBilling: false,
    canAccessAdmin: false,
    
    // Provider-specific permissions
    canManageOwnSchedule: true,
    canViewOwnBookings: true,
    canManageOwnServices: true,
  },
  
  front_desk: {
    // Dashboard Access - Client-facing operations
    canViewRequests: true,
    canManageRequests: true,
    canViewClients: true,
    canManageClients: true,
    canViewLoyalty: true,
    canManageLoyalty: true,
    
    // Settings Access - Limited
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
    
    // Provider-specific permissions
    canManageOwnSchedule: false,
    canViewOwnBookings: false,
    canManageOwnServices: false,
  },
  
  service_provider: {
    // Dashboard Access - Limited to own bookings
    canViewRequests: false,
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
    
    // Provider-specific permissions - Full access
    canManageOwnSchedule: true,
    canViewOwnBookings: true,
    canManageOwnServices: true,
  },
  
  member: {
    // Dashboard Access - Read-only access
    canViewRequests: true,
    canManageRequests: false,
    canViewClients: true,
    canManageClients: false,
    canViewLoyalty: true,
    canManageLoyalty: false,
    
    // Settings Access - None
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
    
    // Provider-specific permissions
    canManageOwnSchedule: false,
    canViewOwnBookings: false,
    canManageOwnServices: false,
  },
}

// Role definitions with descriptions and colors
export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  owner: {
    name: 'Owner',
    description: 'Full access to all features and team management',
    permissions: ROLE_PERMISSIONS.owner,
    color: 'bg-purple-100 text-purple-800',
  },
  admin: {
    name: 'Admin',
    description: 'Full operational access, can manage most settings',
    permissions: ROLE_PERMISSIONS.admin,
    color: 'bg-blue-100 text-blue-800',
  },
  front_desk: {
    name: 'Front Desk',
    description: 'Client-facing operations, booking management, and loyalty',
    permissions: ROLE_PERMISSIONS.front_desk,
    color: 'bg-green-100 text-green-800',
  },
  service_provider: {
    name: 'Service Provider',
    description: 'Manage own schedule, services, and view own bookings',
    permissions: ROLE_PERMISSIONS.service_provider,
    color: 'bg-orange-100 text-orange-800',
  },
  member: {
    name: 'Member',
    description: 'Read-only access to view requests and clients',
    permissions: ROLE_PERMISSIONS.member,
    color: 'bg-gray-100 text-gray-800',
  },
}

// Helper function to get permissions for a role
export function getPermissionsForRole(role: string): TeamMemberPermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.member
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
  return ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.member
}

// Helper function to get all available roles
export function getAvailableRoles(): Array<{ value: string; label: string; description: string }> {
  return Object.entries(ROLE_DEFINITIONS).map(([value, definition]) => ({
    value,
    label: definition.name,
    description: definition.description,
  }))
} 