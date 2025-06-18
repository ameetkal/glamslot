'use client';
import React, { useState } from 'react';

const initialNotifications = {
  email: true,
  sms: true,
  instagram: false,
  bookingRequests: true,
  reminders: true,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);

  function handleToggle(key: keyof typeof notifications) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h1>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Email Notifications</div>
            <div className="mt-1 text-sm text-gray-500">Receive booking notifications via email</div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={() => handleToggle('email')}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-500 peer-focus:ring-offset-2" />
          </label>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">SMS Notifications</div>
            <div className="mt-1 text-sm text-gray-500">Receive booking notifications via text message</div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={notifications.sms}
              onChange={() => handleToggle('sms')}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-500 peer-focus:ring-offset-2" />
          </label>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Instagram Notifications</div>
            <div className="mt-1 text-sm text-gray-500">Receive booking notifications via Instagram DM</div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={notifications.instagram}
              onChange={() => handleToggle('instagram')}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-500 peer-focus:ring-offset-2" />
          </label>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Booking Requests</div>
            <div className="mt-1 text-sm text-gray-500">Get notified when a new booking request is submitted</div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={notifications.bookingRequests}
              onChange={() => handleToggle('bookingRequests')}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-500 peer-focus:ring-offset-2" />
          </label>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Reminders</div>
            <div className="mt-1 text-sm text-gray-500">Get reminders for upcoming appointments</div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={notifications.reminders}
              onChange={() => handleToggle('reminders')}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-500 peer-focus:ring-offset-2" />
          </label>
        </div>
      </div>
    </div>
  );
} 