'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { providerService, serviceService, salonService, teamService } from '@/lib/firebase/services';
import { Provider, Service, Salon } from '@/types/firebase';
import { motion } from 'framer-motion';
import { UserIcon, PhoneIcon, GlobeAltIcon, CogIcon } from '@heroicons/react/24/outline';

export default function ProviderSettingsPage() {
  const { user } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get team member info to find the provider
      const teamMembers = await teamService.getTeamMembers(user.uid);
      const teamMember = teamMembers.find(tm => tm.userId === user.uid);
      
      if (!teamMember) {
        setError('You are not a team member of this salon');
        setLoading(false);
        return;
      }

      // Get salon info
      const salonData = await salonService.getSalon(teamMember.salonId);
      if (!salonData) {
        setError('Salon not found');
        setLoading(false);
        return;
      }
      setSalon(salonData);

      // Find provider record linked to this team member
      const providers = await providerService.getProviders(teamMember.salonId);
      const providerData = providers.find(p => p.teamMemberId === teamMember.id);
      
      if (!providerData) {
        setError('Provider profile not found. Please contact your salon administrator.');
        setLoading(false);
        return;
      }
      setProvider(providerData);

      // Get services
      const servicesData = await serviceService.getServices(teamMember.salonId);
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load provider data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!provider || !user) return;

    try {
      setSaving(true);
      setError('');
      
      const updateData = {
        name: provider.name.trim(),
        availability: provider.availability,
        services: provider.services.map(service => ({
          serviceId: service.serviceId,
          duration: service.duration || 60,
          isSpecialty: service.isSpecialty || false,
          requiresConsultation: service.requiresConsultation || false
        })),
        receiveNotifications: provider.receiveNotifications
      };

      await providerService.updateProvider(provider.id, updateData);
      
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving provider settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateProviderService = (serviceId: string, updates: Partial<{ duration: number; isSpecialty: boolean; requiresConsultation: boolean }>) => {
    setProvider(prev => {
      if (!prev) return prev;
      
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
  };

  const removeProviderService = (serviceId: string) => {
    setProvider(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        services: prev.services.filter(s => s.serviceId !== serviceId)
      };
    });
  };

  const copyBookingUrl = () => {
    if (salon?.bookingUrl) {
      navigator.clipboard.writeText(salon.bookingUrl);
      setSuccess('Booking URL copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Provider profile not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Provider Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your profile, services, and availability
        </p>
      </div>

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md"
        >
          <p className="text-sm text-green-600">{success}</p>
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md"
        >
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <UserIcon className="h-6 w-6 text-gray-400 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Provider Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={provider.name}
                onChange={(e) => setProvider(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>
        </div>

        {/* Booking URL Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <GlobeAltIcon className="h-6 w-6 text-gray-400 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Booking URL</h2>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-1">Your Booking Link</p>
                <p className="text-sm text-gray-600 break-all">{salon?.bookingUrl}</p>
              </div>
              <button
                type="button"
                onClick={copyBookingUrl}
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Copy URL
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Share this link with clients to book appointments with you
            </p>
          </div>
        </div>

        {/* SMS Notifications Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <PhoneIcon className="h-6 w-6 text-gray-400 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">SMS Notifications</h2>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Receive SMS notifications</p>
              <p className="text-xs text-gray-600 mt-1">
                Get notified when clients request appointments with you
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={provider.receiveNotifications}
                onChange={(e) => setProvider(prev => prev ? { 
                  ...prev, 
                  receiveNotifications: e.target.checked 
                } : null)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2" />
            </label>
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <CogIcon className="h-6 w-6 text-gray-400 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">My Services</h2>
          </div>
          
          <div className="space-y-4">
            {services.map((service) => {
              const providerService = provider.services.find(s => s.serviceId === service.id);
              return (
                <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={!!providerService}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateProviderService(service.id, {
                              duration: service.defaultDuration,
                              isSpecialty: false,
                              requiresConsultation: service.requiresConsultation
                            });
                          } else {
                            removeProviderService(service.id);
                          }
                        }}
                        className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-900">{service.name}</span>
                    </div>
                  </div>
                  
                  {providerService && (
                    <div className="ml-7 space-y-3">
                      <div className="flex items-center space-x-4">
                        <label className="text-sm text-gray-600">
                          Duration:
                          <input
                            type="number"
                            min="15"
                            step="15"
                            value={providerService.duration}
                            onChange={(e) => updateProviderService(service.id, {
                              duration: parseInt(e.target.value) || 60
                            })}
                            className="ml-2 w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-accent-500"
                          />
                          min
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={providerService.isSpecialty}
                            onChange={(e) => updateProviderService(service.id, {
                              isSpecialty: e.target.checked
                            })}
                            className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-600">Specialty</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={providerService.requiresConsultation}
                            onChange={(e) => updateProviderService(service.id, {
                              requiresConsultation: e.target.checked
                            })}
                            className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-600">Requires consultation</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 