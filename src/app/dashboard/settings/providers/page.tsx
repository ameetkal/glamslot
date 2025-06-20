'use client';
import React, { useState } from 'react';

interface ProviderAvailabilityDay {
  start: string;
  end: string;
  isAvailable: boolean;
}

interface Service {
  id: number;
  name: string;
  defaultDuration: number;
  requiresConsultation: boolean;
}

interface ProviderService {
  serviceId: number;
  duration: number;
  isSpecialty: boolean;
  requiresConsultation: boolean;
}

interface Provider {
  id: number;
  name: string;
  email: string;
  phone: string;
  availability: Record<string, ProviderAvailabilityDay>;
  services: ProviderService[];
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

const sampleServices: Service[] = [
  { id: 1, name: 'Haircut', defaultDuration: 45, requiresConsultation: false },
  { id: 2, name: 'Color', defaultDuration: 90, requiresConsultation: true },
  { id: 3, name: 'Balayage', defaultDuration: 120, requiresConsultation: true },
  { id: 4, name: 'Highlights', defaultDuration: 90, requiresConsultation: true },
  { id: 5, name: 'Blowout', defaultDuration: 30, requiresConsultation: false },
];

const initialProviders: Provider[] = [
  {
    id: 1,
    name: 'Alice Smith',
    email: 'alice@example.com',
    phone: '555-111-2222',
    availability: {
      ...defaultAvailability,
      monday: { start: '09:00', end: '17:00', isAvailable: true },
      tuesday: { start: '09:00', end: '17:00', isAvailable: true },
    },
    services: [
      { serviceId: 1, duration: 45, isSpecialty: true, requiresConsultation: false },
      { serviceId: 2, duration: 100, isSpecialty: false, requiresConsultation: true },
    ],
  },
  {
    id: 2,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '555-333-4444',
    availability: {
      ...defaultAvailability,
      wednesday: { start: '10:00', end: '16:00', isAvailable: true },
      thursday: { start: '10:00', end: '16:00', isAvailable: true },
    },
    services: [
      { serviceId: 1, duration: 50, isSpecialty: false, requiresConsultation: false },
      { serviceId: 3, duration: 130, isSpecialty: true, requiresConsultation: true },
    ],
  },
];

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<number | null>(null);

  console.log('ProvidersPage mounted, providers:', providers);

  function openAddModal() {
    setEditing({ 
      id: 0, 
      name: '', 
      email: '', 
      phone: '', 
      availability: { ...defaultAvailability },
      services: []
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
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setProviders((prev) => {
      if (editing.id === 0) {
        // Add new
        const newId = Math.max(0, ...prev.map((p) => p.id)) + 1;
        return [...prev, { ...editing, id: newId }];
      } else {
        // Edit existing
        return prev.map((p) => (p.id === editing.id ? editing : p));
      }
    });
    closeModal();
  }

  function handleDelete(id: number) {
    if (window.confirm('Are you sure you want to delete this provider?')) {
      setProviders((prev) => prev.filter((p) => p.id !== id));
    }
  }

  function toggleProviderExpansion(providerId: number) {
    setExpandedProvider(expandedProvider === providerId ? null : providerId);
  }

  function getProviderService(provider: Provider, serviceId: number): ProviderService | undefined {
    return provider.services.find(s => s.serviceId === serviceId);
  }

  function updateProviderService(providerId: number, serviceId: number, updates: Partial<ProviderService>) {
    setProviders(prev => prev.map(provider => {
      if (provider.id !== providerId) return provider;
      
      const existingService = provider.services.find(s => s.serviceId === serviceId);
      if (existingService) {
        // Update existing service
        return {
          ...provider,
          services: provider.services.map(s => 
            s.serviceId === serviceId ? { ...s, ...updates } : s
          )
        };
      } else {
        // Add new service
        const service = sampleServices.find(s => s.id === serviceId);
        if (!service) return provider;
        
        return {
          ...provider,
          services: [...provider.services, {
            serviceId,
            duration: service.defaultDuration,
            isSpecialty: false,
            requiresConsultation: service.requiresConsultation,
            ...updates
          }]
        };
      }
    }));
  }

  function removeProviderService(providerId: number, serviceId: number) {
    setProviders(prev => prev.map(provider => {
      if (provider.id !== providerId) return provider;
      return {
        ...provider,
        services: provider.services.filter(s => s.serviceId !== serviceId)
      };
    }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
        <button className="px-4 py-2 bg-accent-600 text-white rounded-md font-semibold hover:bg-accent-700 transition" onClick={openAddModal}>Add Provider</button>
      </div>
      
      <div>Providers loaded: {providers.length}</div>

      <div className="space-y-4">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-white rounded-lg shadow border">
            {/* Provider Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => toggleProviderExpansion(provider.id)}>
                  <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                  <p className="text-sm text-gray-600">{provider.email} • {provider.phone}</p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="text-accent-700 hover:text-accent-900 text-sm"
                    onClick={() => openEditModal(provider)}
                  >
                    Edit
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-900 text-sm"
                    onClick={() => handleDelete(provider.id)}
                  >
                    Delete
                  </button>
                  <button 
                    className="text-gray-700 hover:text-gray-900 text-sm"
                    onClick={() => toggleProviderExpansion(provider.id)}
                  >
                    {expandedProvider === provider.id ? '▼' : '▶'} Services
                  </button>
                </div>
              </div>
            </div>

            {/* Services Accordion */}
            {expandedProvider === provider.id && (
              <div className="p-4 bg-gray-50">
                <h4 className="text-md font-medium text-gray-900 mb-4">Service Offerings</h4>
                <div className="space-y-3">
                  {sampleServices.map((service) => {
                    const providerService = getProviderService(provider, service.id);
                    const isOffered = !!providerService;
                    
                    return (
                      <div key={service.id} className="bg-white rounded border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isOffered}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateProviderService(provider.id, service.id, {});
                                } else {
                                  removeProviderService(provider.id, service.id);
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                            />
                            <span className="font-medium text-gray-900">{service.name}</span>
                          </div>
                          {isOffered && (
                            <button
                              onClick={() => removeProviderService(provider.id, service.id)}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        {isOffered && providerService && (
                          <div className="ml-7 space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Duration (minutes)
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={providerService.duration}
                                  onChange={(e) => updateProviderService(provider.id, service.id, {
                                    duration: parseInt(e.target.value) || service.defaultDuration
                                  })}
                                  className="w-full border rounded px-2 py-1 text-sm placeholder:text-gray-600"
                                  placeholder="Duration"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`specialty-${provider.id}-${service.id}`}
                                  checked={providerService.isSpecialty}
                                  onChange={(e) => updateProviderService(provider.id, service.id, {
                                    isSpecialty: e.target.checked
                                  })}
                                  className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                                />
                                <label htmlFor={`specialty-${provider.id}-${service.id}`} className="text-xs text-gray-700">
                                  Specialty Service
                                </label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`consultation-${provider.id}-${service.id}`}
                                  checked={providerService.requiresConsultation}
                                  onChange={(e) => updateProviderService(provider.id, service.id, {
                                    requiresConsultation: e.target.checked
                                  })}
                                  className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                                />
                                <label htmlFor={`consultation-${provider.id}-${service.id}`} className="text-xs text-gray-700">
                                  Requires Consultation
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{editing.id === 0 ? 'Add' : 'Edit'} Provider</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 placeholder:text-gray-600"
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Enter provider name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 placeholder:text-gray-600"
                  value={editing.email}
                  onChange={e => setEditing({ ...editing, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full border rounded px-3 py-2 placeholder:text-gray-600"
                  value={editing.phone}
                  onChange={e => setEditing({ ...editing, phone: e.target.value })}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div className="rounded-lg bg-gray-50 p-4 mt-6">
                <h3 className="text-md font-medium text-gray-900 mb-2">Default Availability</h3>
                <div className="space-y-4">
                  {Object.entries(editing.availability).map(([day, schedule]) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-32">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={schedule.isAvailable}
                            onChange={e => setEditing({
                              ...editing,
                              availability: {
                                ...editing.availability,
                                [day]: { ...schedule, isAvailable: e.target.checked }
                              }
                            })}
                            className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </span>
                        </label>
                      </div>
                      {schedule.isAvailable && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={schedule.start}
                            onChange={e => setEditing({
                              ...editing,
                              availability: {
                                ...editing.availability,
                                [day]: { ...schedule, start: e.target.value }
                              }
                            })}
                            className="w-32 border rounded px-2 py-1"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={schedule.end}
                            onChange={e => setEditing({
                              ...editing,
                              availability: {
                                ...editing.availability,
                                [day]: { ...schedule, end: e.target.value }
                              }
                            })}
                            className="w-32 border rounded px-2 py-1"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={closeModal}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-accent-600 text-white rounded hover:bg-accent-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 