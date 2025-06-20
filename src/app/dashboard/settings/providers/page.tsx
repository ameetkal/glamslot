'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { providerService, serviceService } from '@/lib/firebase/services';
import { Provider, Service, ProviderService } from '@/types/firebase';
import Modal from '@/components/ui/Modal';

interface ProviderAvailabilityDay {
  start: string;
  end: string;
  isAvailable: boolean;
}

const defaultAvailability: Record<string, ProviderAvailabilityDay> = {
  monday: { start: '09:00', end: '17:00', isAvailable: false },
  tuesday: { start: '09:00', end: '17:00', isAvailable: false },
  wednesday: { start: '09:00', end: '17:00', isAvailable: false },
  thursday: { start: '09:00', end: '17:00', isAvailable: false },
  friday: { start: '09:00', end: '17:00', isAvailable: false },
  saturday: { start: '10:00', end: '15:00', isAvailable: false },
  sunday: { start: '10:00', end: '15:00', isAvailable: false },
};

export default function ProvidersPage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [providersData, servicesData] = await Promise.all([
        providerService.getProviders(user.uid),
        serviceService.getServices(user.uid)
      ]);
      setProviders(providersData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching providers:', error);
      setError('Failed to load providers');
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
      availability: { ...defaultAvailability },
      services: [],
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

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing || !user) return;

    try {
      setError('');
      
      if (editing.id) {
        // Update existing provider
        const updateData = {
          name: editing.name.trim(),
          email: editing.email.trim(),
          phone: editing.phone.trim(),
          availability: editing.availability,
          services: editing.services.map(service => ({
            serviceId: service.serviceId,
            duration: service.duration || 60,
            isSpecialty: service.isSpecialty || false,
            requiresConsultation: service.requiresConsultation || false
          }))
        };

        // Validate that all required fields have values
        if (!updateData.name || !updateData.email || !updateData.phone) {
          setError('Please fill in all required fields');
          return;
        }

        await providerService.updateProvider(editing.id, updateData);
      } else {
        // Create new provider
        const providerData = {
          name: editing.name.trim(),
          email: editing.email.trim(),
          phone: editing.phone.trim(),
          availability: editing.availability,
          services: editing.services.map(service => ({
            serviceId: service.serviceId,
            duration: service.duration || 60,
            isSpecialty: service.isSpecialty || false,
            requiresConsultation: service.requiresConsultation || false
          })),
          salonId: user.uid
        };

        // Validate that all required fields have values
        if (!providerData.name || !providerData.email || !providerData.phone) {
          setError('Please fill in all required fields');
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

  function toggleProviderExpansion(providerId: string) {
    setExpandedProvider(expandedProvider === providerId ? null : providerId);
  }

  function getServiceName(serviceId: string): string {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Unknown Service';
  }

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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
    }
    return `${mins}m`;
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
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
      
      <div className="space-y-4">
        {providers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No providers found. Add your first provider to get started.</p>
          </div>
        ) : (
          providers.map((provider) => (
            <div key={provider.id} className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-2 -m-2 transition-colors"
                  onClick={() => toggleProviderExpansion(provider.id)}
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                    <p className="text-sm text-gray-600">{provider.email}</p>
                    <p className="text-sm text-gray-600">{provider.phone}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(provider);
                      }}
                      className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(provider.id);
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {expandedProvider === provider.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Services</h4>
                    {provider.services.length === 0 ? (
                      <p className="text-sm text-gray-500">No services assigned</p>
                    ) : (
                      <div className="space-y-2">
                        {provider.services.map((providerService) => (
                          <div key={providerService.serviceId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {getServiceName(providerService.serviceId)}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                {formatDuration(providerService.duration || 60)}
                              </span>
                              {providerService.isSpecialty && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Specialty
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Provider Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={closeModal}
        title={editing?.id ? 'Edit Provider' : 'Add Provider'}
      >
        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={editing?.name || ''}
                onChange={(e) => setEditing(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="Provider name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                required
                value={editing?.email || ''}
                onChange={(e) => setEditing(prev => prev ? { ...prev, email: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="provider@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                id="phone"
                required
                value={editing?.phone || ''}
                onChange={(e) => setEditing(prev => prev ? { ...prev, phone: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="(555) 123-4567"
              />
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
                          {/* Duration input */}
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="15"
                              step="15"
                              value={providerService.duration || 60}
                              onChange={(e) => updateProviderService(editing?.id || '', service.id, {
                                duration: parseInt(e.target.value)
                              })}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-gray-900 bg-white"
                            />
                            <span className="text-sm text-gray-600">minutes</span>
                          </div>
                          
                          {/* Checkboxes on separate line */}
                          <div className="flex flex-wrap gap-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={providerService.isSpecialty || false}
                                onChange={(e) => updateProviderService(editing?.id || '', service.id, {
                                  isSpecialty: e.target.checked
                                })}
                                className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">Specialty</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={providerService.requiresConsultation || false}
                                onChange={(e) => updateProviderService(editing?.id || '', service.id, {
                                  requiresConsultation: e.target.checked
                                })}
                                className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">Consultation Required</span>
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
    </div>
  );
} 