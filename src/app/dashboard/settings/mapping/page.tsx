'use client';

import React, { useState } from 'react';

interface Provider {
  id: number;
  name: string;
}
interface Service {
  id: number;
  name: string;
}
interface Mapping {
  providerId: number;
  serviceId: number;
  duration: number;
  isSpecialty: boolean;
  requiresConsultation: boolean;
}

const sampleProviders: Provider[] = [
  { id: 1, name: 'Alice Smith' },
  { id: 2, name: 'Bob Johnson' },
];
const sampleServices: Service[] = [
  { id: 1, name: 'Haircut' },
  { id: 2, name: 'Color' },
  { id: 3, name: 'Balayage' },
];
const initialMappings: Mapping[] = [
  { providerId: 1, serviceId: 1, duration: 45, isSpecialty: true, requiresConsultation: false },
  { providerId: 1, serviceId: 2, duration: 100, isSpecialty: false, requiresConsultation: true },
  { providerId: 2, serviceId: 1, duration: 50, isSpecialty: false, requiresConsultation: false },
  { providerId: 2, serviceId: 3, duration: 130, isSpecialty: true, requiresConsultation: true },
];

type EditingMapping = {
  providerId: number;
  serviceId: number;
  duration: number | string;
  isSpecialty: boolean;
  requiresConsultation: boolean;
};

function getMapping(mappings: Mapping[], providerId: number, serviceId: number): Mapping | undefined {
  return mappings.find(
    (m) => m.providerId === providerId && m.serviceId === serviceId
  );
}

export default function MappingPage() {
  const [mappings, setMappings] = useState<Mapping[]>(initialMappings);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingMapping | null>(null);

  function openEditModal(providerId: number, serviceId: number) {
    const mapping = getMapping(mappings, providerId, serviceId);
    setEditing(
      mapping || {
        providerId,
        serviceId,
        duration: '',
        isSpecialty: false,
        requiresConsultation: false,
      }
    );
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setMappings((prev) => {
      const exists = getMapping(prev, editing.providerId, editing.serviceId);
      if (exists) {
        return prev.map((m) =>
          m.providerId === editing.providerId && m.serviceId === editing.serviceId
            ? { ...editing, duration: Number(editing.duration) }
            : m
        );
      } else {
        return [
          ...prev,
          { ...editing, duration: Number(editing.duration) },
        ];
      }
    });
    closeModal();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Provider-Service Mapping</h1>
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
              {sampleServices.map((service) => (
                <th key={service.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {service.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sampleProviders.map((provider) => (
              <tr key={provider.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{provider.name}</td>
                {sampleServices.map((service) => {
                  const mapping = getMapping(mappings, provider.id, service.id);
                  return (
                    <td key={service.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                      {mapping ? (
                        <div>
                          <div>Duration: {mapping.duration} min</div>
                          <div>Specialty: {mapping.isSpecialty ? 'Yes' : 'No'}</div>
                          <div>Consult: {mapping.requiresConsultation ? 'Yes' : 'No'}</div>
                          <button className="mt-2 text-accent-600 hover:text-accent-900 text-xs" onClick={() => openEditModal(provider.id, service.id)}>Edit</button>
                        </div>
                      ) : (
                        <button className="text-accent-600 hover:text-accent-900 text-xs" onClick={() => openEditModal(provider.id, service.id)}>Add</button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {modalOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{getMapping(mappings, editing.providerId, editing.serviceId) ? 'Edit' : 'Add'} Mapping</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border rounded px-3 py-2"
                  value={editing.duration}
                  onChange={e => setEditing({ ...editing, duration: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isSpecialty"
                  checked={editing.isSpecialty}
                  onChange={e => setEditing({ ...editing, isSpecialty: e.target.checked })}
                />
                <label htmlFor="isSpecialty" className="text-sm">Specialty</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresConsultation"
                  checked={editing.requiresConsultation}
                  onChange={e => setEditing({ ...editing, requiresConsultation: e.target.checked })}
                />
                <label htmlFor="requiresConsultation" className="text-sm">Requires Consultation</label>
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