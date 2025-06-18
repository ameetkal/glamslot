import React from 'react';

// TODO: Replace with real data fetching from the database
const sampleServices = [
  { id: 1, name: 'Haircut', defaultDuration: 45, requiresConsultation: false },
  { id: 2, name: 'Color', defaultDuration: 90, requiresConsultation: true },
  { id: 3, name: 'Balayage', defaultDuration: 120, requiresConsultation: true },
];

export default function ServicesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <button className="px-4 py-2 bg-accent-600 text-white rounded-md font-semibold hover:bg-accent-700 transition">Add Service</button>
      </div>
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Duration (min)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultation Required</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sampleServices.map((service) => (
              <tr key={service.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.defaultDuration}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.requiresConsultation ? 'Yes' : 'No'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-accent-600 hover:text-accent-900 mr-4">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 