'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useSalonContext } from '@/lib/hooks/useSalonContext';
import { serviceService } from '@/lib/firebase/services';
import { Service } from '@/types/firebase';
import Modal from '@/components/ui/Modal';
import DraggableList from '@/components/ui/DraggableList';

export default function ServicesPage() {
  const { user } = useAuth();
  const { salonId: contextSalonId, salonName, isImpersonating } = useSalonContext();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [error, setError] = useState('');
  const [isReordering, setIsReordering] = useState(false);

  const fetchServices = useCallback(async () => {
    if (!user || !contextSalonId) return;
    
    try {
      setLoading(true);
      console.log('🔍 Fetching services for salon:', contextSalonId);
      const fetchedServices = await serviceService.getServices(contextSalonId);
      setServices(fetchedServices);
      console.log('✅ Services fetched:', fetchedServices.length);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [user, contextSalonId]);

  useEffect(() => {
    if (user && contextSalonId) {
      fetchServices();
    }
  }, [user, contextSalonId, fetchServices]);

  const openAddModal = () => {
    setEditing({
      id: '',
      name: '',
      description: '',
      salonId: contextSalonId || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    setModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditing({ ...service });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setError('');
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing || !user) return;

    try {
      setError('');
      
      if (editing.id) {
        // Update existing service
        await serviceService.updateService(editing.id, {
          name: editing.name,
          description: editing.description
        });
      } else {
        // Create new service
        await serviceService.createService({
          name: editing.name,
          description: editing.description,
          salonId: contextSalonId || ''
        });
      }
      
      closeModal();
      fetchServices(); // Refresh the list
    } catch (error) {
      console.error('Error saving service:', error);
      setError('Failed to save service');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await serviceService.deleteService(id);
      fetchServices(); // Refresh the list
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Failed to delete service');
    }
  };

  const handleReorder = async (newServices: Service[]) => {
    setServices(newServices);
    setIsReordering(true);
    
    try {
      // Update the order in the database
      const updates = newServices.map((service, index) => ({
        id: service.id,
        order: index + 1
      }));
      
      await serviceService.updateServicesOrder(updates);
    } catch (error) {
      console.error('Error updating service order:', error);
      setError('Failed to save new order');
      // Revert to original order
      fetchServices();
    } finally {
      setIsReordering(false);
    }
  };

  const renderServiceItem = (service: Service) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">{service.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{service.description || 'No description'}</p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button 
            className="text-gray-700 hover:text-gray-900 transition-colors font-medium text-sm"
            onClick={() => openEditModal(service)}
          >
            Edit
          </button>
          <button 
            className="text-red-600 hover:text-red-900 transition-colors text-sm"
            onClick={() => handleDelete(service.id)}
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
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-600 mt-1">
            Drag and drop to reorder services. The order will be reflected on your booking form.
          </p>
          {isImpersonating && (
            <div className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              <span>👁️ Viewing as SuperAdmin: {salonName}</span>
            </div>
          )}
        </div>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition shadow-sm"
          onClick={openAddModal}
        >
          Add Service
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isReordering && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-600">Saving new order...</p>
        </div>
      )}
      
      {services.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No services found. Add your first service to get started.</p>
        </div>
      ) : (
        <DraggableList
          items={services}
          onReorder={handleReorder}
          renderItem={renderServiceItem}
          getItemId={(service) => service.id}
          className="space-y-3"
          itemClassName=""
        />
      )}

      {/* Add/Edit Service Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={closeModal}
        title={editing?.id ? 'Edit Service' : 'Add Service'}
      >
        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={editing?.name || ''}
                onChange={(e) => setEditing(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="e.g., Haircut, Color, Balayage"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={editing?.description || ''}
                onChange={(e) => setEditing(prev => prev ? { ...prev, description: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="Brief description of the service"
                rows={3}
              />
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
                {editing?.id ? 'Update' : 'Create'} Service
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
} 