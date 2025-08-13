'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useSalonContext } from '@/lib/hooks/useSalonContext'
import { teamService } from '@/lib/firebase/services'
import { TeamMember, Invitation, TeamMemberPermissions } from '@/types/firebase'
import { getAvailableRoles, getRoleDefinition, getPermissionsForRole } from '@/lib/permissions'
import { 
  UserPlusIcon,
  EnvelopeIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  TrashIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function AdminPage() {
  const { user } = useAuth()
  const { salonId: contextSalonId, salonName, isImpersonating } = useSalonContext()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingInvite, setSendingInvite] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [invitationUrl, setInvitationUrl] = useState('')
  const [showPermissions, setShowPermissions] = useState<{ [key: string]: boolean }>({})
  
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'member'
  })

  const availableRoles = getAvailableRoles()

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!user || !contextSalonId) return

      try {
        setLoading(true)
        console.log('🔍 Fetching team data for salon:', contextSalonId)
        
        // Fetch real team members and invitations from Firestore
        const [teamMembersData, invitationsData] = await Promise.all([
          teamService.getTeamMembers(contextSalonId),
          teamService.getInvitations(contextSalonId)
        ])
        
        // Convert Firestore timestamps to Date objects
        const processedTeamMembers = teamMembersData.map(member => ({
          ...member,
          invitedAt: member.invitedAt instanceof Date ? member.invitedAt : 
                    (member.invitedAt && typeof member.invitedAt === 'object' && 'toDate' in member.invitedAt ? 
                     (member.invitedAt as { toDate: () => Date }).toDate() : new Date(member.invitedAt)),
          joinedAt: member.joinedAt instanceof Date ? member.joinedAt : 
                   (member.joinedAt && typeof member.joinedAt === 'object' && 'toDate' in member.joinedAt ? 
                    (member.joinedAt as { toDate: () => Date }).toDate() : (member.joinedAt ? new Date(member.joinedAt) : undefined))
        }))
        
        const processedInvitations = invitationsData.map(invitation => ({
          ...invitation,
          invitedAt: invitation.invitedAt instanceof Date ? invitation.invitedAt : 
                    (invitation.invitedAt && typeof invitation.invitedAt === 'object' && 'toDate' in invitation.invitedAt ? 
                     (invitation.invitedAt as { toDate: () => Date }).toDate() : new Date(invitation.invitedAt)),
          expiresAt: invitation.expiresAt instanceof Date ? invitation.expiresAt : 
                    (invitation.expiresAt && typeof invitation.expiresAt === 'object' && 'toDate' in invitation.expiresAt ? 
                     (invitation.expiresAt as { toDate: () => Date }).toDate() : new Date(invitation.expiresAt))
        }))
        
        setTeamMembers(processedTeamMembers)
        setInvitations(processedInvitations)
      } catch (error) {
        console.error('Error fetching team data:', error)
        setError('Failed to load team information')
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [user, contextSalonId])

  const handleInviteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    try {
      setSendingInvite(true)
      setError('')
      setSuccess('')

      // Get permissions for the selected role
      const permissions = getPermissionsForRole(inviteForm.role)

      // Send invitation via API
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: inviteForm.name,
          email: inviteForm.email,
          role: inviteForm.role,
          permissions: permissions,
          salonId: contextSalonId,
          invitedBy: user.email
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send invitation')
      }

      const result = await response.json()
      
      if (result.success) {
        // Refresh the invitations list
        const invitationsData = await teamService.getInvitations(user.uid)
        setInvitations(invitationsData)
        
        setInviteForm({ name: '', email: '', role: 'member' })
        const invitationUrl = `${window.location.origin}/join/${result.invitationId}`
        setInvitationUrl(invitationUrl)
        
        if (result.message.includes('email failed')) {
          setSuccess(`Invitation created but email failed to send. Please send this link manually: ${invitationUrl}`)
        } else {
          setSuccess(`Invitation sent successfully to ${inviteForm.email}! The invitation link is: ${invitationUrl}`)
        }
        
        // Clear success message after 10 seconds (longer to copy URL)
        setTimeout(() => setSuccess(''), 10000)
      } else {
        throw new Error(result.message || 'Failed to send invitation')
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      setError('Failed to send invitation. Please try again.')
    } finally {
      setSendingInvite(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      await teamService.removeTeamMember(userId)
      
      // Refresh team members list
      const teamMembersData = await teamService.getTeamMembers(contextSalonId || '')
      setTeamMembers(teamMembersData)
      
      setSuccess('Team member removed successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error removing team member:', error)
      setError('Failed to remove team member.')
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return

    try {
      const response = await fetch(`/api/invite?id=${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to cancel invitation')
      }

      // Refresh invitations list
      const invitationsData = await teamService.getInvitations(contextSalonId || '')
      setInvitations(invitationsData)
      
      setSuccess('Invitation cancelled successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      setError('Failed to cancel invitation.')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    const roleDef = getRoleDefinition(role)
    return roleDef.color
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'invited':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: unknown) => {
    let jsDate: Date;
    if (!date) return '';
    if (date instanceof Date) {
      jsDate = date;
    } else if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as { toDate: () => Date }).toDate === 'function') {
      jsDate = (date as { toDate: () => Date }).toDate();
    } else if (typeof date === 'string' || typeof date === 'number') {
      jsDate = new Date(date);
    } else {
      return '';
    }
    if (isNaN(jsDate.getTime())) return '';
    return jsDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  const copyInvitationUrl = async () => {
    try {
      await navigator.clipboard.writeText(invitationUrl)
      setSuccess('Invitation URL copied to clipboard!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
      setError('Failed to copy URL to clipboard')
    }
  }

  const togglePermissions = (memberId: string) => {
    setShowPermissions(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
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
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {permissionGroups.map((group) => (
            <div key={group.title}>
              <h5 className="text-sm font-medium text-gray-700 mb-2">{group.title}</h5>
              <div className="space-y-1">
                {group.permissions.map((permission) => (
                  <div key={permission.key} className="flex items-center text-xs">
                    {permissions[permission.key as keyof TeamMemberPermissions] ? (
                      <CheckIcon className="h-3 w-3 text-green-500 mr-2" />
                    ) : (
                      <XMarkIcon className="h-3 w-3 text-red-500 mr-2" />
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading team information...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Team Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage team members and their access permissions
            </p>
            {isImpersonating && (
              <div className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <span>👁️ Viewing as SuperAdmin: {salonName}</span>
              </div>
            )}
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => {
                const inviteForm = document.getElementById('invite-form')
                inviteForm?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              <UserPlusIcon className="h-4 w-4" />
              Invite Member
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-green-800">{success}</p>
                {invitationUrl && (
                  <div className="mt-2 flex items-center space-x-2">
                    <input
                      type="text"
                      value={invitationUrl}
                      readOnly
                      className="flex-1 text-xs bg-white border border-green-200 rounded px-2 py-1 text-green-800"
                    />
                    <button
                      onClick={copyInvitationUrl}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XMarkIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Invite New Member */}
          <div id="invite-form" className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Invite Team Member</h3>
              <p className="mt-1 text-sm text-gray-700">
                Send an invitation to join your salon dashboard with specific role permissions
              </p>
            </div>
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    required
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
                    placeholder="Enter team member name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  id="role"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
                >
                  {availableRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
                <div className="mt-2">
                  <Link 
                    href="/dashboard/settings/admin/roles"
                    className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                  >
                    <ShieldCheckIcon className="h-4 w-4 mr-1" />
                    View detailed role permissions
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={sendingInvite}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingInvite ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Current Team Members */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Current Team Members</h3>
              <p className="mt-1 text-sm text-gray-700">
                {teamMembers.length} active team member{teamMembers.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-6">
              {teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No team members yet</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Invite team members to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-accent-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-accent-700">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-600">{member.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                                {getRoleDefinition(member.role).name}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(member.status)}`}>
                                {member.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => togglePermissions(member.id)}
                            className="text-gray-600 hover:text-gray-800"
                            title="View permissions"
                          >
                            <ShieldCheckIcon className="h-5 w-5" />
                          </button>
                          {member.role !== 'owner' && (
                            <button
                              onClick={() => handleRemoveMember(member.userId)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove member"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Permissions Section */}
                      {showPermissions[member.id] && member.permissions && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          <h5 className="text-sm font-medium text-gray-700 mt-3 mb-2">Permissions</h5>
                          {renderPermissions(member.permissions)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Pending Invitations</h3>
              <p className="mt-1 text-sm text-gray-700">
                {invitations.length} invitation{invitations.length !== 1 ? 's' : ''} waiting for response
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <ClockIcon className="h-8 w-8 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{invitation.name}</p>
                        <p className="text-sm text-gray-600">{invitation.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Invited on {formatDate(invitation.invitedAt)} • Expires {formatDate(invitation.expiresAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 