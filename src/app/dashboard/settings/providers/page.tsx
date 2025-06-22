'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { providerService, serviceService } from '@/lib/firebase/services';
import { Provider, Service, ProviderService } from '@/types/firebase';
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
          <h3 className="text-sm font-medium text-gray-900">{provider.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{provider.email} • {provider.phone}</p>
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
            Drag and drop to reorder providers. The order will be reflected on your booking form.
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
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Provider Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={editing?.name || ''}
                onChange={(e) => setEditing(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="e.g., Sarah Johnson"
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
                placeholder="sarah@salon.com"
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
    </div>
  );
} 