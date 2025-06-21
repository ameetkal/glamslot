'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { salonService } from '@/lib/firebase/services';
import { PhoneIcon, PlusIcon, XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface SmsRecipient {
  phone: string;
  enabled: boolean;
}

interface EmailRecipient {
  email: string;
  enabled: boolean;
}

interface SalonNotifications {
  email: boolean;
  sms: boolean;
  smsRecipients: SmsRecipient[];
  emailRecipients: EmailRecipient[];
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
  smsRecipients: [
    { phone: '555-123-4567', enabled: true }
  ],
  emailRecipients: [],
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

// Client-side email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Client-side phone number validation functions
function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// Format phone number to E.164 format for SMS (client-side)
function formatPhoneForSMS(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it's 10 digits, add +1 prefix for US numbers
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it's 11 digits and starts with 1, add + prefix
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // If it already starts with +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Fallback: add +1 prefix
  return `+1${cleaned}`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [salonNotifications, setSalonNotifications] = useState<SalonNotifications>(initialSalonNotifications);
  const [clientNotifications, setClientNotifications] = useState<ClientNotifications>(initialClientNotifications);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [newEmailAddress, setNewEmailAddress] = useState('');
  const [emailError, setEmailError] = useState('');
  const [testSMSStatus, setTestSMSStatus] = useState<{ [key: string]: 'idle' | 'sending' | 'success' | 'error' }>({});
  const [testEmailStatus, setTestEmailStatus] = useState<{ [key: string]: 'idle' | 'sending' | 'success' | 'error' }>({});
  const [loading, setLoading] = useState(true);

  // Save notification settings to Firestore automatically
  const saveNotificationSettings = async () => {
    if (!user || loading) return;
    
    try {
      console.log('Saving notification settings:', {
        email: salonNotifications.email,
        sms: salonNotifications.sms,
        smsRecipients: salonNotifications.smsRecipients,
        emailRecipients: salonNotifications.emailRecipients
      });
      
      await salonService.updateSalonSettings(user.uid, {
        notifications: {
          email: salonNotifications.email,
          sms: salonNotifications.sms,
          smsRecipients: salonNotifications.smsRecipients,
          emailRecipients: salonNotifications.emailRecipients,
          bookingConfirmation: true,
          bookingReminders: true
        }
      });
      console.log('Notification settings saved successfully');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      // Optionally show a user-friendly error message
      alert('Failed to save notification settings. Please try again.');
    }
  };

  // Initialize SMS service with current settings
  useEffect(() => {
    // This will be replaced with actual Firestore loading
  }, []);

  // Load existing notification settings from Firestore
  useEffect(() => {
    const loadNotificationSettings = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const salon = await salonService.getSalon(user.uid);
        
        if (salon?.settings?.notifications) {
          const notifications = salon.settings.notifications;
          console.log('Loaded notifications from database:', notifications);
          
          // Handle existing smsRecipients properly
          let smsRecipients = notifications.smsRecipients || [];
          
          // If smsRecipients is empty but we have an owner phone, add it
          if (smsRecipients.length === 0 && salon.ownerPhone) {
            smsRecipients = [{ phone: salon.ownerPhone, enabled: true }];
          }
          
          // Handle existing emailRecipients properly
          let emailRecipients: EmailRecipient[] = notifications.emailRecipients || [];
          
          // If emailRecipients is empty but we have an owner email, add it
          if (emailRecipients.length === 0 && salon.ownerEmail) {
            emailRecipients = [{ email: salon.ownerEmail, enabled: true }];
          }
          
          setSalonNotifications({
            email: notifications.email ?? true,
            sms: notifications.sms ?? false,
            smsRecipients: smsRecipients,
            emailRecipients: emailRecipients
          });
        } else if (salon?.ownerPhone) {
          // If no notification settings exist yet, initialize with salon phone
          console.log('No notification settings found, initializing with owner phone:', salon.ownerPhone);
          
          // Initialize email recipients with salon email if available
          let emailRecipients: EmailRecipient[] = [];
          if (salon.ownerEmail) {
            emailRecipients = [{ email: salon.ownerEmail, enabled: true }];
          }
          
          setSalonNotifications({
            email: true,
            sms: false,
            smsRecipients: [{ phone: salon.ownerPhone, enabled: true }],
            emailRecipients: emailRecipients
          });
        } else {
          // No salon data at all, use defaults
          console.log('No salon data found, using defaults');
          setSalonNotifications(initialSalonNotifications);
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
        // Use defaults on error
        setSalonNotifications(initialSalonNotifications);
      } finally {
        setLoading(false);
      }
    };

    loadNotificationSettings();
  }, [user]);

  function handleSalonToggle(key: keyof Omit<SalonNotifications, 'smsRecipients' | 'emailRecipients'>) {
    setSalonNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    // Auto-save after a short delay to avoid too many API calls
    setTimeout(() => saveNotificationSettings(), 500);
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
    if (salonNotifications.smsRecipients.some(r => r.phone === trimmedPhone)) {
      setPhoneError('This phone number is already added');
      return;
    }
    const formattedPhone = formatPhoneNumber(trimmedPhone);
    setSalonNotifications((prev) => ({
      ...prev,
      smsRecipients: [...prev.smsRecipients, { phone: formattedPhone, enabled: true }]
    }));
    // Initialize test status for the new phone number
    setTestSMSStatus(prev => ({ ...prev, [formattedPhone]: 'idle' }));
    setNewPhoneNumber('');
    setPhoneError('');
    // Save immediately instead of with delay
    saveNotificationSettings();
  }

  function handleRemoveSmsRecipient(phoneNumber: string) {
    setSalonNotifications((prev) => ({
      ...prev,
      smsRecipients: prev.smsRecipients.filter(r => r.phone !== phoneNumber)
    }));
    // Save immediately instead of with delay
    saveNotificationSettings();
  }

  function handleToggleSmsRecipient(phoneNumber: string) {
    setSalonNotifications((prev) => ({
      ...prev,
      smsRecipients: prev.smsRecipients.map(r =>
        r.phone === phoneNumber ? { ...r, enabled: !r.enabled } : r
      )
    }));
    // Save immediately instead of with delay
    saveNotificationSettings();
  }

  async function handleTestSms(phoneNumber: string) {
    setTestSMSStatus(prev => ({ ...prev, [phoneNumber]: 'sending' }));
    
    try {
      // Format phone number to E.164 format for SMS service
      const formattedPhone = formatPhoneForSMS(phoneNumber);
      
      const response = await fetch('/api/sms/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      });

      const data = await response.json();
      const success = response.ok && data.success;
      
      setTestSMSStatus(prev => ({ 
        ...prev, 
        [phoneNumber]: success ? 'success' : 'error' 
      }));

      // Reset status after 3 seconds
      setTimeout(() => {
        setTestSMSStatus(prev => ({ ...prev, [phoneNumber]: 'idle' }));
      }, 3000);
    } catch {
      setTestSMSStatus(prev => ({ ...prev, [phoneNumber]: 'error' }));
      setTimeout(() => {
        setTestSMSStatus(prev => ({ ...prev, [phoneNumber]: 'idle' }));
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

  // Email Recipient Management Functions
  function handleAddEmailRecipient() {
    const trimmedEmail = newEmailAddress.trim();
    if (!trimmedEmail) {
      setEmailError('Email address is required');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    const emailExists = salonNotifications.emailRecipients.some(
      recipient => recipient.email.toLowerCase() === trimmedEmail.toLowerCase()
    );

    if (emailExists) {
      setEmailError('This email address is already in the list');
      return;
    }

    setSalonNotifications(prev => ({
      ...prev,
      emailRecipients: [...prev.emailRecipients, { email: trimmedEmail, enabled: true }]
    }));

    setNewEmailAddress('');
    setEmailError('');
    
    // Save immediately
    setTimeout(() => saveNotificationSettings(), 100);
  }

  function handleRemoveEmailRecipient(emailAddress: string) {
    setSalonNotifications(prev => ({
      ...prev,
      emailRecipients: prev.emailRecipients.filter(recipient => recipient.email !== emailAddress)
    }));
    
    // Save immediately
    setTimeout(() => saveNotificationSettings(), 100);
  }

  function handleToggleEmailRecipient(emailAddress: string) {
    setSalonNotifications(prev => ({
      ...prev,
      emailRecipients: prev.emailRecipients.map(recipient =>
        recipient.email === emailAddress
          ? { ...recipient, enabled: !recipient.enabled }
          : recipient
      )
    }));
    
    // Save immediately
    setTimeout(() => saveNotificationSettings(), 100);
  }

  async function handleTestEmail(emailAddress: string) {
    setTestEmailStatus(prev => ({ ...prev, [emailAddress]: 'sending' }));
    
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailAddress }),
      });

      const data = await response.json();
      const success = response.ok && data.success;
      
      setTestEmailStatus(prev => ({ 
        ...prev, 
        [emailAddress]: success ? 'success' : 'error' 
      }));

      // Reset status after 3 seconds
      setTimeout(() => {
        setTestEmailStatus(prev => ({ ...prev, [emailAddress]: 'idle' }));
      }, 3000);
    } catch {
      setTestEmailStatus(prev => ({ ...prev, [emailAddress]: 'error' }));
      setTimeout(() => {
        setTestEmailStatus(prev => ({ ...prev, [emailAddress]: 'idle' }));
      }, 3000);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notification settings...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
          </div>
          
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
                          {salonNotifications.smsRecipients.map((recipient, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                              <div className="flex items-center">
                                <PhoneIcon className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm text-gray-900">{recipient.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="relative inline-flex cursor-pointer items-center mr-2">
                                  <input
                                    type="checkbox"
                                    checked={recipient.enabled}
                                    onChange={() => handleToggleSmsRecipient(recipient.phone)}
                                    className="peer sr-only"
                                  />
                                  <div className="peer h-5 w-10 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2" />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleTestSms(recipient.phone)}
                                  disabled={testSMSStatus[recipient.phone] === 'sending'}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                                >
                                  {testSMSStatus[recipient.phone] === 'sending' && 'Sending...'}
                                  {testSMSStatus[recipient.phone] === 'success' && '✓ Sent'}
                                  {testSMSStatus[recipient.phone] === 'error' && '✗ Failed'}
                                  {testSMSStatus[recipient.phone] === 'idle' && 'Test SMS'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSmsRecipient(recipient.phone)}
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
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

                  {/* Email Recipients Management */}
                  {salonNotifications.email && (
                    <div className="pl-4 border-l-2 border-accent-200 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Email Recipients</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Add email addresses that should receive email notifications for new booking requests.
                        </p>
                        
                        {/* Current Recipients */}
                        <div className="space-y-2 mb-4">
                          {salonNotifications.emailRecipients.map((recipient, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                              <div className="flex items-center">
                                <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm text-gray-900">{recipient.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="relative inline-flex cursor-pointer items-center mr-2">
                                  <input
                                    type="checkbox"
                                    checked={recipient.enabled}
                                    onChange={() => handleToggleEmailRecipient(recipient.email)}
                                    className="peer sr-only"
                                  />
                                  <div className="peer h-5 w-10 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2" />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleTestEmail(recipient.email)}
                                  disabled={testEmailStatus[recipient.email] === 'sending'}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                                >
                                  {testEmailStatus[recipient.email] === 'sending' && 'Sending...'}
                                  {testEmailStatus[recipient.email] === 'success' && '✓ Sent'}
                                  {testEmailStatus[recipient.email] === 'error' && '✗ Failed'}
                                  {testEmailStatus[recipient.email] === 'idle' && 'Test Email'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEmailRecipient(recipient.email)}
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
                              type="email"
                              value={newEmailAddress}
                              onChange={(e) => {
                                setNewEmailAddress(e.target.value);
                                if (emailError) setEmailError('');
                              }}
                              placeholder="Enter email address"
                              className={`flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                                emailError ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={handleAddEmailRecipient}
                              disabled={!newEmailAddress.trim()}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                          {emailError && (
                            <p className="text-sm text-red-600">{emailError}</p>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-2">
                          Email notification: &ldquo;New Booking Request: visit [booking URL] to view&rdquo;
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
        </>
      )}
    </div>
  );
} 