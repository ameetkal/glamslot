import React from 'react';

// TODO: Replace with real data fetching from the database
const sampleServices = [
  { id: 1, name: 'Haircut' },
  { id: 2, name: 'Color' },
  { id: 3, name: 'Balayage' },
  { id: 4, name: 'Highlights' },
  { id: 5, name: 'Beard Trim' },
  { id: 6, name: 'Hair Treatment' },
];

export default function ServicesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your service offerings. Duration and consultation settings are configured per provider.
          </p>
        </div>
        <button className="px-4 py-2 bg-accent-600 text-white rounded-md font-semibold hover:bg-accent-700 transition">
          Add Service
        </button>
      </div>
      
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sampleServices.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {service.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-accent-700 hover:text-accent-900 mr-4 transition-colors">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900 transition-colors">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 