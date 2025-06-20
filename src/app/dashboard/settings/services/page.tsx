'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { serviceService } from '@/lib/firebase/services';
import { Service } from '@/types/firebase';
import Modal from '@/components/ui/Modal';

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchServices();
    }
  }, [user]);

  const fetchServices = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const fetchedServices = await serviceService.getServices(user.uid);
      setServices(fetchedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditing({
      id: '',
      name: '',
      description: '',
      salonId: user?.uid || '',
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
          salonId: user.uid
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
          <p className="mt-1 text-sm text-gray-600">
            Manage your service offerings. Duration and consultation settings are configured per provider.
          </p>
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
      
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                  No services found. Add your first service to get started.
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {service.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {service.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-accent-700 hover:text-accent-900 mr-4 transition-colors"
                      onClick={() => openEditModal(service)}
                    >
                      Edit
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900 transition-colors"
                      onClick={() => handleDelete(service.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
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