'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { providerService, serviceService, teamService } from '@/lib/firebase/services';
import { Provider, Service, ProviderService, TeamMember } from '@/types/firebase';
import Modal from '@/components/ui/Modal';
import DraggableList from '@/components/ui/DraggableList';

export default function ProvidersPage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [sendingInvite, setSendingInvite] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showTeamMemberDropdown, setShowTeamMemberDropdown] = useState(false);
  const [filteredTeamMembers, setFilteredTeamMembers] = useState<TeamMember[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [providersData, servicesData, teamMembersData] = await Promise.all([
        providerService.getProviders(user.uid),
        serviceService.getServices(user.uid),
        teamService.getTeamMembers(user.uid)
      ]);
      setProviders(providersData);
      setServices(servicesData);
      setTeamMembers(teamMembersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  function openAddModal() {
    setEditing({
      id: '',
      name: '',
      email: '',
      phone: '',
      salonId: user?.uid || '',
      availability: {},
      services: [],
      isTeamMember: false,
      receiveNotifications: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    setModalOpen(true);
  }

  function openEditModal(provider: Provider) {
    setEditing({ 
      ...provider, 
      availability: { ...provider.availability },
      services: [...provider.services]
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setError('');
  }

  function openInviteModal(providerName: string) {
    setInviteForm({
      name: providerName,
      email: '',
      phone: ''
    });
    setInviteModalOpen(true);
  }

  function closeInviteModal() {
    setInviteModalOpen(false);
    setInviteForm({ name: '', email: '', phone: '' });
    setError('');
  }

  function handleProviderNameChange(name: string) {
    setEditing(prev => prev ? { ...prev, name } : null);
    
    // Filter team members based on name input
    if (name.length > 0) {
      const filtered = teamMembers.filter(member => 
        member.name.toLowerCase().includes(name.toLowerCase()) &&
        !providers.some(provider => provider.teamMemberId === member.id)
      );
      setFilteredTeamMembers(filtered);
      setShowTeamMemberDropdown(filtered.length > 0);
    } else {
      setShowTeamMemberDropdown(false);
    }
  }

  function selectTeamMember(member: TeamMember) {
    setEditing(prev => prev ? {
      ...prev,
      name: member.name,
      teamMemberId: member.id,
      isTeamMember: true,
      receiveNotifications: true
    } : null);
    setShowTeamMemberDropdown(false);
  }

  async function handleSendInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    try {
      setSendingInvite(true);
      setError('');

      // Send invitation via API
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: inviteForm.name,
          email: inviteForm.email,
          phone: inviteForm.phone,
          role: 'service_provider',
          salonId: user.uid,
          invitedBy: user.email
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update the provider to enable notifications (will be active when they join)
        if (editing) {
          await providerService.updateProvider(editing.id, {
            receiveNotifications: true
          });
        }
        
        closeInviteModal();
        fetchData(); // Refresh the list
        
        setError(''); // Clear any previous errors
        setSuccess('SMS invitation sent successfully! Provider will receive SMS notifications once they join.');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        throw new Error(result.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setSendingInvite(false);
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing || !user) return;

    try {
      setError('');
      
      if (editing.id) {
        // Update existing provider
        const updateData = {
          name: editing.name.trim(),
          availability: editing.availability,
          services: editing.services.map(service => ({
            serviceId: service.serviceId,
            duration: service.duration || 60,
            isSpecialty: service.isSpecialty || false,
            requiresConsultation: service.requiresConsultation || false
          })),
          isTeamMember: editing.isTeamMember,
          teamMemberId: editing.teamMemberId,
          receiveNotifications: editing.receiveNotifications
        };

        // Validate that all required fields have values
        if (!updateData.name) {
          setError('Please fill in the provider name');
          return;
        }

        await providerService.updateProvider(editing.id, updateData);
      } else {
        // Create new provider
        const providerData = {
          name: editing.name.trim(),
          email: '', // Will be filled in when provider joins
          phone: '', // Will be filled in when provider joins
          availability: editing.availability,
          services: editing.services.map(service => ({
            serviceId: service.serviceId,
            duration: service.duration || 60,
            isSpecialty: service.isSpecialty || false,
            requiresConsultation: service.requiresConsultation || false
          })),
          isTeamMember: editing.isTeamMember || false,
          teamMemberId: editing.teamMemberId,
          receiveNotifications: editing.receiveNotifications || false,
          salonId: user.uid
        };

        // Validate that all required fields have values
        if (!providerData.name) {
          setError('Please fill in the provider name');
          return;
        }

        await providerService.createProvider(providerData);
      }
      
      closeModal();
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error saving provider:', error);
      setError('Failed to save provider');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this provider?')) return;

    try {
      await providerService.deleteProvider(id);
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error deleting provider:', error);
      setError('Failed to delete provider');
    }
  }

  const handleReorder = async (newProviders: Provider[]) => {
    setProviders(newProviders);
    
    try {
      // Update the order in the database
      const updates = newProviders.map((provider, index) => ({
        id: provider.id,
        order: index + 1
      }));
      
      await providerService.updateProvidersOrder(updates);
    } catch (error) {
      console.error('Error updating provider order:', error);
      setError('Failed to save new order');
      // Revert to original order
      fetchData();
    }
  };

  function updateProviderService(providerId: string, serviceId: string, updates: Partial<ProviderService>) {
    setEditing(prev => {
      if (!prev || prev.id !== providerId) return prev;
      
      const existingService = prev.services.find(s => s.serviceId === serviceId);
      if (existingService) {
        // Update existing service
        return {
          ...prev,
          services: prev.services.map(s => 
            s.serviceId === serviceId ? { ...s, ...updates } : s
          )
        };
      } else {
        // Add new service
        const service = services.find(s => s.id === serviceId);
        if (!service) return prev;
        
        return {
          ...prev,
          services: [...prev.services, {
            serviceId,
            duration: service.defaultDuration || 60,
            isSpecialty: false,
            requiresConsultation: service.requiresConsultation || false,
            ...updates
          }]
        };
      }
    });
  }

  function removeProviderService(providerId: string, serviceId: string) {
    setEditing(prev => {
      if (!prev || prev.id !== providerId) return prev;
      return {
        ...prev,
        services: prev.services.filter(s => s.serviceId !== serviceId)
      };
    });
  }

  const renderProviderItem = (provider: Provider) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900">{provider.name}</h3>
            {provider.isTeamMember && provider.teamMemberId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Team Member
              </span>
            )}
            {provider.teamMemberId && !provider.isTeamMember && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Invited as User
              </span>
            )}

            {provider.receiveNotifications && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                SMS Enabled
              </span>
            )}
          </div>
          {provider.services.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {provider.services.length} service{provider.services.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button 
            className="text-gray-700 hover:text-gray-900 transition-colors font-medium text-sm"
            onClick={() => openEditModal(provider)}
          >
            Edit
          </button>
          <button 
            className="text-red-600 hover:text-red-900 transition-colors text-sm"
            onClick={() => handleDelete(provider.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
          <p className="text-sm text-gray-600 mt-1">
            Add service providers with their name and services. Contact details can be added when they join the platform.
          </p>
        </div>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition shadow-sm"
          onClick={openAddModal}
        >
          Add Provider
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {providers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No providers found. Add your first provider to get started.</p>
        </div>
      ) : (
        <DraggableList
          items={providers}
          onReorder={handleReorder}
          renderItem={renderProviderItem}
          getItemId={(provider) => provider.id}
          className="space-y-3"
          itemClassName=""
        />
      )}

      {/* Add/Edit Provider Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={closeModal}
        title={editing?.id ? 'Edit Provider' : 'Add Provider'}
      >
        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="relative">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Provider Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={editing?.name || ''}
                onChange={(e) => handleProviderNameChange(e.target.value)}
                onFocus={() => {
                  if (editing?.name && editing.name.length > 0) {
                    const filtered = teamMembers.filter(member => 
                      member.name.toLowerCase().includes(editing.name.toLowerCase()) &&
                      !providers.some(provider => provider.teamMemberId === member.id)
                    );
                    setFilteredTeamMembers(filtered);
                    setShowTeamMemberDropdown(filtered.length > 0);
                  }
                }}
                onBlur={() => {
                  // Delay hiding dropdown to allow for clicks
                  setTimeout(() => setShowTeamMemberDropdown(false), 200);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="e.g., Sarah Johnson"
              />
              
              {/* Team Member Dropdown */}
              {showTeamMemberDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredTeamMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => selectTeamMember(member)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">{member.name}</span>
                        <span className="text-xs text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Team Member
                        </span>
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTeamMemberDropdown(false);
                        setEditing(prev => prev ? { 
                          ...prev, 
                          teamMemberId: undefined,
                          isTeamMember: false 
                        } : null);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm text-gray-600"
                    >
                      Create new provider
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMS Notifications
              </label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Receive SMS notifications</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Provider will receive SMS notifications for their own appointments
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {!editing?.isTeamMember && editing?.receiveNotifications && (
                    <button
                      type="button"
                      onClick={() => openInviteModal(editing?.name || '')}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Invite to Join
                    </button>
                  )}
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={editing?.receiveNotifications || false}
                      onChange={(e) => {
                        if (e.target.checked && !editing?.isTeamMember) {
                          openInviteModal(editing?.name || '');
                        } else {
                          setEditing(prev => prev ? { 
                            ...prev, 
                            receiveNotifications: e.target.checked 
                          } : null);
                        }
                      }}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2" />
                  </label>
                </div>
              </div>
              {!editing?.isTeamMember && (
                <p className="text-xs text-gray-500 mt-1">
                  Provider must join the platform to receive SMS notifications
                </p>
              )}
              {editing?.isTeamMember && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Team member selected - SMS notifications will be enabled
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Services
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {services.map((service) => {
                  const providerService = editing?.services.find(s => s.serviceId === service.id);
                  return (
                    <div key={service.id} className="border border-gray-200 rounded p-3">
                      {/* First line: Service name and checkbox */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={!!providerService}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateProviderService(editing?.id || '', service.id, {
                                  duration: service.defaultDuration,
                                  isSpecialty: false,
                                  requiresConsultation: service.requiresConsultation
                                });
                              } else {
                                removeProviderService(editing?.id || '', service.id);
                              }
                            }}
                            className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-900">{service.name}</span>
                        </div>
                      </div>
                      
                      {/* Second line: Duration and options (only show if service is selected) */}
                      {providerService && (
                        <div className="ml-7 space-y-2">
                          <div className="flex items-center space-x-4">
                            <label className="text-xs text-gray-600">
                              Duration:
                              <input
                                type="number"
                                min="15"
                                step="15"
                                value={providerService.duration}
                                onChange={(e) => updateProviderService(editing?.id || '', service.id, {
                                  duration: parseInt(e.target.value) || 60
                                })}
                                className="ml-1 w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-accent-500"
                              />
                              min
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={providerService.isSpecialty}
                                onChange={(e) => updateProviderService(editing?.id || '', service.id, {
                                  isSpecialty: e.target.checked
                                })}
                                className="h-3 w-3 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                              />
                              <span className="text-xs text-gray-600">Specialty</span>
                            </label>
                            
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={providerService.requiresConsultation}
                                onChange={(e) => updateProviderService(editing?.id || '', service.id, {
                                  requiresConsultation: e.target.checked
                                })}
                                className="h-3 w-3 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                              />
                              <span className="text-xs text-gray-600">Requires consultation</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editing?.id ? 'Update' : 'Create'} Provider
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Invite Provider Modal */}
      <Modal 
        isOpen={inviteModalOpen} 
        onClose={closeInviteModal}
        title="Invite Provider to Join"
      >
        <div className="p-6">
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                To enable SMS notifications, {inviteForm.name} needs to join the platform. 
                We&apos;ll send them an invitation via SMS.
              </p>
            </div>

            <div>
              <label htmlFor="invite-name" className="block text-sm font-medium text-gray-700 mb-1">
                Provider Name
              </label>
              <input
                type="text"
                id="invite-name"
                required
                value={inviteForm.name}
                onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="Provider name"
              />
            </div>

            <div>
              <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="invite-email"
                required
                value={inviteForm.email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="provider@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for account creation (invitation will be sent via SMS)
              </p>
            </div>

            <div>
              <label htmlFor="invite-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="invite-phone"
                required
                value={inviteForm.phone}
                onChange={(e) => setInviteForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="+1 (555) 123-4567"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for SMS notifications about appointments
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={closeInviteModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingInvite}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingInvite ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
} 