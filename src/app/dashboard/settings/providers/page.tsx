'use client';
import React, { useState } from 'react';

interface ProviderAvailabilityDay {
  start: string;
  end: string;
  isAvailable: boolean;
}

interface Provider {
  id: number;
  name: string;
  email: string;
  phone: string;
  availability: Record<string, ProviderAvailabilityDay>;
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
  },
];

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [availabilityOpen, setAvailabilityOpen] = useState<number | null>(null);

  function openAddModal() {
    setEditing({ id: 0, name: '', email: '', phone: '', availability: { ...defaultAvailability } });
    setModalOpen(true);
  }
  function openEditModal(provider: Provider) {
    setEditing({ ...provider, availability: { ...provider.availability } });
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
        <button className="px-4 py-2 bg-accent-600 text-white rounded-md font-semibold hover:bg-accent-700 transition" onClick={openAddModal}>Add Provider</button>
      </div>
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {providers.map((provider) => (
              <tr key={provider.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{provider.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{provider.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{provider.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2 justify-end">
                  <button className="text-accent-600 hover:text-accent-900" onClick={() => openEditModal(provider)}>Edit</button>
                  <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(provider.id)}>Delete</button>
                  <button className="text-blue-600 hover:text-blue-900" onClick={() => setAvailabilityOpen(provider.id)}>Availability</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                  className="w-full border rounded px-3 py-2"
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={editing.email}
                  onChange={e => setEditing({ ...editing, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full border rounded px-3 py-2"
                  value={editing.phone}
                  onChange={e => setEditing({ ...editing, phone: e.target.value })}
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

      {/* Availability Modal (stub) */}
      {availabilityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Provider Availability (Coming Soon)</h2>
            <p className="mb-4">This will use the same UI as the Profile → Availability tab.</p>
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setAvailabilityOpen(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 