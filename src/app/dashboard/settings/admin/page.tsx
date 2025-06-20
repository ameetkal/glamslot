'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { teamService } from '@/lib/firebase/services'
import { 
  UserPlusIcon,
  EnvelopeIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'pending' | 'invited'
  invitedAt: Date
  joinedAt?: Date
  salonId: string
}

interface Invitation {
  id: string
  email: string
  name: string
  salonId: string
  status: 'pending' | 'accepted' | 'expired'
  invitedAt: Date
  expiresAt: Date
  invitedBy: string
}

export default function AdminPage() {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingInvite, setSendingInvite] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: ''
  })

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!user) return

      try {
        setLoading(true)
        
        // Fetch real team members and invitations from Firestore
        const [teamMembersData, invitationsData] = await Promise.all([
          teamService.getTeamMembers(user.uid),
          teamService.getInvitations(user.uid)
        ])
        
        setTeamMembers(teamMembersData)
        setInvitations(invitationsData)
      } catch (error) {
        console.error('Error fetching team data:', error)
        setError('Failed to load team information')
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [user])

  const handleInviteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    try {
      setSendingInvite(true)
      setError('')
      setSuccess('')

      // Send invitation via API
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: inviteForm.name,
          email: inviteForm.email,
          salonId: user.uid,
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
        
        setInviteForm({ name: '', email: '' })
        setSuccess(`Invitation sent to ${inviteForm.email}!`)
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
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

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      await teamService.removeTeamMember(memberId)
      
      // Refresh team members list
      const teamMembersData = await teamService.getTeamMembers(user!.uid)
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
      const invitationsData = await teamService.getInvitations(user!.uid)
      setInvitations(invitationsData)
      
      setSuccess('Invitation cancelled successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      setError('Failed to cancel invitation.')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'member':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
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
                Send an invitation to join your salon dashboard
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
                    <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
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
                              {member.role}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(member.status)}`}>
                              {member.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
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