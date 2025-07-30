'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { providerService, serviceService, salonService, teamService } from '@/lib/firebase/services';
import { Provider, Service } from '@/types/firebase';
import { motion } from 'framer-motion';
import { UserIcon, PhoneIcon, GlobeAltIcon, CogIcon } from '@heroicons/react/24/outline';

export default function ProviderSettingsPage() {
  const { user } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) {
      console.log('🔍 DEBUG: No user found, returning early');
      return;
    }
    
    console.log('🔍 DEBUG: Starting fetchData for user:', user.uid);
    console.log('🔍 DEBUG: User email:', user.email);
    
    try {
      setLoading(true);
      
      // Step 1: Get team member info
      console.log('🔍 DEBUG: Step 1 - Fetching team member for user:', user.uid);
      const teamMember = await teamService.getTeamMemberByUserId(user.uid);
      console.log('🔍 DEBUG: Team member result:', teamMember);
      
      if (!teamMember) {
        console.log('🔍 DEBUG: ❌ Team member not found');
        setError('You are not a team member of this salon');
        setLoading(false);
        return;
      }
      
      console.log('🔍 DEBUG: ✅ Team member found:', {
        id: teamMember.id,
        salonId: teamMember.salonId,
        role: teamMember.role,
        userId: teamMember.userId
      });

      // Step 2: Get salon info
      console.log('🔍 DEBUG: Step 2 - Fetching salon for salonId:', teamMember.salonId);
      const salonData = await salonService.getSalon(teamMember.salonId);
      console.log('🔍 DEBUG: Salon result:', salonData);
      
      if (!salonData) {
        console.log('🔍 DEBUG: ❌ Salon not found for salonId:', teamMember.salonId);
        setError('Salon not found');
        setLoading(false);
        return;
      }
      
      console.log('🔍 DEBUG: ✅ Salon found:', {
        id: salonData.id,
        name: salonData.name,
        ownerEmail: salonData.ownerEmail
      });

      // Step 3: Get providers
      console.log('🔍 DEBUG: Step 3 - Fetching providers for salonId:', teamMember.salonId);
      const providers = await providerService.getProviders(teamMember.salonId);
      console.log('🔍 DEBUG: Providers result:', providers);
      console.log('🔍 DEBUG: Looking for provider with teamMemberId:', teamMember.id);
      
      const providerData = providers.find(p => p.teamMemberId === teamMember.id);
      console.log('🔍 DEBUG: Found provider data:', providerData);
      
      if (!providerData) {
        console.log('🔍 DEBUG: ❌ Provider not found for teamMemberId:', teamMember.id);
        console.log('🔍 DEBUG: Available providers:', providers.map(p => ({ id: p.id, teamMemberId: p.teamMemberId, name: p.name })));
        setError('Provider profile not found. Please contact your salon administrator.');
        setLoading(false);
        return;
      }
      
      console.log('🔍 DEBUG: ✅ Provider found:', {
        id: providerData.id,
        name: providerData.name,
        teamMemberId: providerData.teamMemberId
      });
      setProvider(providerData);

      // Generate booking URL if it doesn't exist
      if (!providerData.bookingUrl) {
        console.log('🔍 DEBUG: No booking URL found, generating one...');
        try {
          const providerUrl = `${salonData.bookingUrl}?provider=${providerData.id}`;
          await providerService.updateProvider(providerData.id, { bookingUrl: providerUrl });
          console.log('🔍 DEBUG: ✅ Generated booking URL:', providerUrl);
          // Update the local state with the new URL
          setProvider(prev => prev ? { ...prev, bookingUrl: providerUrl } : null);
        } catch (urlError) {
          console.error('🔍 DEBUG: ❌ Error generating booking URL:', urlError);
        }
      }

      // Step 4: Get services
      console.log('🔍 DEBUG: Step 4 - Fetching services for salonId:', teamMember.salonId);
      const servicesData = await serviceService.getServices(teamMember.salonId);
      console.log('🔍 DEBUG: Services result:', servicesData);
      setServices(servicesData);
      
      console.log('🔍 DEBUG: ✅ All data fetched successfully');
      
    } catch (error: unknown) {
      console.error('🔍 DEBUG: ❌ Error in fetchData:', error);
              console.error('🔍 DEBUG: Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: (error as { code?: string })?.code || 'unknown',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        });
      
      // Log specific error types
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'permission-denied') {
        console.log('🔍 DEBUG: 🔒 PERMISSION DENIED - This is likely a Firestore rules issue');
      } else if (errorCode === 'not-found') {
        console.log('🔍 DEBUG: 📍 NOT FOUND - Document doesn\'t exist');
      } else if (errorCode === 'unavailable') {
        console.log('🔍 DEBUG: 🌐 UNAVAILABLE - Network/Firebase service issue');
      }
      
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
    if (provider?.bookingUrl) {
      navigator.clipboard.writeText(provider.bookingUrl);
      setSuccess('Your direct booking link copied to clipboard!');
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
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Provider Settings</h1>
        <p className="text-sm text-gray-600">
          Manage your profile, services, and availability
        </p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md"
        >
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Profile & Booking URL Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Profile Section */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center mb-3">
              <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-base font-semibold text-gray-900">Profile</h2>
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Provider Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={provider.name || ''}
                onChange={(e) => setProvider(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm"
              />
            </div>
          </div>

          {/* Booking URL Section */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center mb-3">
              <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-base font-semibold text-gray-900">Your Direct Booking Link</h2>
            </div>
            
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Share this link with clients for direct booking</p>
              <p className="text-xs text-gray-600 break-all mb-2">{provider?.bookingUrl || 'Loading...'}</p>
              <button
                type="button"
                onClick={copyBookingUrl}
                disabled={!provider?.bookingUrl}
                className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Copy URL
              </button>
            </div>
          </div>
        </div>

        {/* SMS Notifications Section */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <h2 className="text-base font-semibold text-gray-900">SMS Notifications</h2>
                <p className="text-xs text-gray-600">
                  Get notified when clients request appointments
                </p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={provider.receiveNotifications || false}
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
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center mb-3">
            <CogIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-base font-semibold text-gray-900">My Services</h2>
          </div>
          
          <div className="space-y-2">
            {services.map((service) => {
              const providerService = provider.services.find(s => s.serviceId === service.id);
              return (
                <div key={service.id} className="border border-gray-200 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
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
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center space-x-3">
                        <label className="text-xs text-gray-600">
                          Duration:
                          <input
                            type="number"
                            min="15"
                            step="15"
                            value={providerService.duration || 60}
                            onChange={(e) => updateProviderService(service.id, {
                              duration: parseInt(e.target.value) || 60
                            })}
                            className="ml-1 w-12 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-accent-500"
                          />
                          min
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={providerService.isSpecialty || false}
                            onChange={(e) => updateProviderService(service.id, {
                              isSpecialty: e.target.checked
                            })}
                            className="h-3 w-3 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                          />
                          <span className="text-xs text-gray-600">Specialty</span>
                        </label>
                        
                        <label className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={providerService.requiresConsultation || false}
                            onChange={(e) => updateProviderService(service.id, {
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

        {/* Save Button */}
        <div className="flex justify-end pt-2 relative">
          {success && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute right-20 top-0 p-2 bg-green-50 border border-green-200 rounded-md"
            >
              <p className="text-sm text-green-600">{success}</p>
            </motion.div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 