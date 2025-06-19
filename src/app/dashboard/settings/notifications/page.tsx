'use client';
import React, { useState } from 'react';
import { PhoneIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SmsService, formatPhoneNumber, isValidPhoneNumber } from '@/lib/smsService';

interface SalonNotifications {
  email: boolean;
  sms: boolean;
  smsRecipients: string[];
}

interface ClientNotifications {
  bookingAccepted: {
    sms: boolean;
    email: boolean;
  };
  bookingDeclined: {
    sms: boolean;
    email: boolean;
  };
  appointmentReminders: {
    enabled: boolean;
    hoursBefore: number;
    sms: boolean;
    email: boolean;
  };
}

const initialSalonNotifications: SalonNotifications = {
  email: true,
  sms: false,
  smsRecipients: ['555-123-4567'], // Default salon number
};

const initialClientNotifications: ClientNotifications = {
  bookingAccepted: {
    sms: false,
    email: false,
  },
  bookingDeclined: {
    sms: false,
    email: false,
  },
  appointmentReminders: {
    enabled: false,
    hoursBefore: 24,
    sms: false,
    email: false,
  },
};

export default function NotificationsPage() {
  const [salonNotifications, setSalonNotifications] = useState<SalonNotifications>(initialSalonNotifications);
  const [clientNotifications, setClientNotifications] = useState<ClientNotifications>(initialClientNotifications);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [testSmsStatus, setTestSmsStatus] = useState<{ [key: string]: 'idle' | 'sending' | 'success' | 'error' }>({});

  // Initialize SMS service with current settings
  React.useEffect(() => {
    const smsService = SmsService.getInstance();
    smsService.updateSalonSettings({
      enabled: salonNotifications.sms,
      recipients: salonNotifications.smsRecipients
    });
  }, [salonNotifications.sms, salonNotifications.smsRecipients]);

  function handleSalonToggle(key: keyof Omit<SalonNotifications, 'smsRecipients'>) {
    setSalonNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleAddSmsRecipient() {
    const trimmedPhone = newPhoneNumber.trim();
    
    if (!trimmedPhone) {
      setPhoneError('Phone number is required');
      return;
    }

    if (!isValidPhoneNumber(trimmedPhone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }

    if (salonNotifications.smsRecipients.includes(trimmedPhone)) {
      setPhoneError('This phone number is already added');
      return;
    }

    const formattedPhone = formatPhoneNumber(trimmedPhone);
    setSalonNotifications((prev) => ({
      ...prev,
      smsRecipients: [...prev.smsRecipients, formattedPhone]
    }));
    setNewPhoneNumber('');
    setPhoneError('');
  }

  function handleRemoveSmsRecipient(phoneNumber: string) {
    setSalonNotifications((prev) => ({
      ...prev,
      smsRecipients: prev.smsRecipients.filter(phone => phone !== phoneNumber)
    }));
  }

  async function handleTestSms(phoneNumber: string) {
    setTestSmsStatus(prev => ({ ...prev, [phoneNumber]: 'sending' }));
    
    try {
      const smsService = SmsService.getInstance();
      const success = await smsService.sendTestSms(phoneNumber);
      
      setTestSmsStatus(prev => ({ 
        ...prev, 
        [phoneNumber]: success ? 'success' : 'error' 
      }));

      // Reset status after 3 seconds
      setTimeout(() => {
        setTestSmsStatus(prev => ({ ...prev, [phoneNumber]: 'idle' }));
      }, 3000);
    } catch {
      setTestSmsStatus(prev => ({ ...prev, [phoneNumber]: 'error' }));
      setTimeout(() => {
        setTestSmsStatus(prev => ({ ...prev, [phoneNumber]: 'idle' }));
      }, 3000);
    }
  }

  function handleClientBookingToggle(type: 'bookingAccepted' | 'bookingDeclined', channel: 'sms' | 'email') {
    setClientNotifications((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: !prev[type][channel]
      }
    }));
  }

  function handleReminderToggle(channel: 'sms' | 'email') {
    setClientNotifications((prev) => ({
      ...prev,
      appointmentReminders: {
        ...prev.appointmentReminders,
        [channel]: !prev.appointmentReminders[channel]
      }
    }));
  }

  function handleReminderEnabledToggle() {
    setClientNotifications((prev) => ({
      ...prev,
      appointmentReminders: {
        ...prev.appointmentReminders,
        enabled: !prev.appointmentReminders.enabled
      }
    }));
  }

  function handleHoursBeforeChange(hours: number) {
    setClientNotifications((prev) => ({
      ...prev,
      appointmentReminders: {
        ...prev.appointmentReminders,
        hoursBefore: hours
      }
    }));
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h1>
      
      <div className="space-y-8">
        {/* Salon Notifications Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Salon Notifications</h2>
          <p className="text-sm text-gray-600 mb-6">
            Internal notifications for salon staff and management when new booking requests arrive.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Email Notifications</div>
                <div className="mt-1 text-sm text-gray-500">Receive internal notifications via email</div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={salonNotifications.email}
                  onChange={() => handleSalonToggle('email')}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2" />
              </label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">SMS Notifications</div>
                  <div className="mt-1 text-sm text-gray-500">Receive instant text messages for new booking requests</div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={salonNotifications.sms}
                    onChange={() => handleSalonToggle('sms')}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2" />
                </label>
              </div>

              {/* SMS Recipients Management */}
              {salonNotifications.sms && (
                <div className="pl-4 border-l-2 border-accent-200 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">SMS Recipients</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Add phone numbers that should receive SMS notifications for new booking requests.
                    </p>
                    
                    {/* Current Recipients */}
                    <div className="space-y-2 mb-4">
                      {salonNotifications.smsRecipients.map((phone, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                          <div className="flex items-center">
                            <PhoneIcon className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-900">{phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleTestSms(phone)}
                              disabled={testSmsStatus[phone] === 'sending'}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                            >
                              {testSmsStatus[phone] === 'sending' && 'Sending...'}
                              {testSmsStatus[phone] === 'success' && '✓ Sent'}
                              {testSmsStatus[phone] === 'error' && '✗ Failed'}
                              {testSmsStatus[phone] === 'idle' && 'Test SMS'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSmsRecipient(phone)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add New Recipient */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={newPhoneNumber}
                          onChange={(e) => {
                            setNewPhoneNumber(e.target.value);
                            if (phoneError) setPhoneError('');
                          }}
                          placeholder="Enter phone number (e.g., 555-123-4567)"
                          className={`flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                            phoneError ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleAddSmsRecipient}
                          disabled={!newPhoneNumber.trim()}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      {phoneError && (
                        <p className="text-sm text-red-600">{phoneError}</p>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      SMS message: &ldquo;New Booking Request: visit [booking URL] to view&rdquo;
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client Notifications Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Notifications</h2>
          <p className="text-sm text-gray-600 mb-6">
            Notifications sent to clients about their booking requests and appointments.
          </p>
          
          <div className="space-y-6">
            {/* Booking Request Accepted */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-md font-medium text-gray-900 mb-3">When Booking Request is Accepted</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Email</div>
                    <div className="text-sm text-gray-500">Send confirmation email to client</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={clientNotifications.bookingAccepted.email}
                      onChange={() => handleClientBookingToggle('bookingAccepted', 'email')}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2" />
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">SMS</div>
                    <div className="text-sm text-gray-500">Send confirmation text message to client</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={clientNotifications.bookingAccepted.sms}
                      onChange={() => handleClientBookingToggle('bookingAccepted', 'sms')}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2" />
                  </label>
                </div>
              </div>
            </div>

            {/* Booking Request Declined */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-md font-medium text-gray-900 mb-3">When Booking Request is Declined</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Email</div>
                    <div className="text-sm text-gray-500">Send decline notification email to client</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={clientNotifications.bookingDeclined.email}
                      onChange={() => handleClientBookingToggle('bookingDeclined', 'email')}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2" />
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">SMS</div>
                    <div className="text-sm text-gray-500">Send decline notification text message to client</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={clientNotifications.bookingDeclined.sms}
                      onChange={() => handleClientBookingToggle('bookingDeclined', 'sms')}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2" />
                  </label>
                </div>
              </div>
            </div>

            {/* Appointment Reminders */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-medium text-gray-900">Appointment Reminders</h3>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={clientNotifications.appointmentReminders.enabled}
                    onChange={handleReminderEnabledToggle}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2" />
                </label>
              </div>
              
              {clientNotifications.appointmentReminders.enabled && (
                <div className="space-y-4 pl-4 border-l-2 border-accent-200">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Send reminder</label>
                    <select
                      value={clientNotifications.appointmentReminders.hoursBefore}
                      onChange={(e) => handleHoursBeforeChange(Number(e.target.value))}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    >
                      <option value={1}>1 hour before</option>
                      <option value={2}>2 hours before</option>
                      <option value={4}>4 hours before</option>
                      <option value={6}>6 hours before</option>
                      <option value={12}>12 hours before</option>
                      <option value={24}>24 hours before</option>
                      <option value={48}>48 hours before</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Email</div>
                        <div className="text-sm text-gray-500">Send reminder email to client</div>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={clientNotifications.appointmentReminders.email}
                          onChange={() => handleReminderToggle('email')}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2" />
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">SMS</div>
                        <div className="text-sm text-gray-500">Send reminder text message to client</div>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={clientNotifications.appointmentReminders.sms}
                          onChange={() => handleReminderToggle('sms')}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2" />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 