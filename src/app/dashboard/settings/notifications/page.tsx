'use client';
import React, { useState } from 'react';

interface SalonNotifications {
  email: boolean;
  sms: boolean;
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

  function handleSalonToggle(key: keyof SalonNotifications) {
    setSalonNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
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
            Internal notifications for salon staff and management.
          </p>
          
          <div className="space-y-4">
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

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">SMS Notifications</div>
                <div className="mt-1 text-sm text-gray-500">Receive internal notifications via text message</div>
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