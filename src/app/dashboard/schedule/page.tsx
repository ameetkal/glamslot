'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Calendar, Clock, Phone, Mail, PlusIcon } from 'lucide-react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { shiftChangeRequestService, teamService } from '@/lib/firebase/services';
import { ShiftChangeRequest } from '@/types/firebase';

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  date: Timestamp;
  time: string;
  status: string;
  notes?: string;
}

export default function MySchedulePage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'schedule' | 'requests'>('requests');
  const [shiftRequests, setShiftRequests] = useState<ShiftChangeRequest[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    currentShift: { date: '', startTime: '', endTime: '' },
    requestedShift: { date: '', startTime: '', endTime: '' },
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchMySchedule = useCallback(async () => {
    if (!user?.uid) return;

    console.log('🔍 SCHEDULE DEBUG: Starting fetchMySchedule for user:', user.uid);
    console.log('🔍 SCHEDULE DEBUG: User email:', user.email);

    try {
      setLoading(true);
      
      // Step 1: Get team member info first
      console.log('🔍 SCHEDULE DEBUG: Step 1 - Getting team member info');
      const userTeamMember = await teamService.getTeamMemberByUserId(user.uid);
      console.log('🔍 SCHEDULE DEBUG: Team member result:', userTeamMember);
      
      if (!userTeamMember) {
        console.log('🔍 SCHEDULE DEBUG: ❌ No team member found');
        setBookings([]);
        setLoading(false);
        return;
      }
      
      console.log('🔍 SCHEDULE DEBUG: ✅ Team member found:', {
        id: userTeamMember.id,
        salonId: userTeamMember.salonId,
        role: userTeamMember.role
      });
      
      // Step 2: Get the provider's services using teamMemberId
      console.log('🔍 SCHEDULE DEBUG: Step 2 - Getting provider info with teamMemberId:', userTeamMember.id);
      const providerDoc = await getDocs(
        query(
          collection(db, 'providers'),
          where('teamMemberId', '==', userTeamMember.id)
        )
      );

      console.log('🔍 SCHEDULE DEBUG: Provider query result:', {
        empty: providerDoc.empty,
        size: providerDoc.size
      });

      if (providerDoc.empty) {
        console.log('🔍 SCHEDULE DEBUG: ❌ No provider found for teamMemberId:', userTeamMember.id);
        setBookings([]);
        setLoading(false);
        return;
      }

      const provider = providerDoc.docs[0].data();
      console.log('🔍 SCHEDULE DEBUG: ✅ Provider found:', {
        id: providerDoc.docs[0].id,
        name: provider.name,
        teamMemberId: provider.teamMemberId,
        services: provider.services?.length || 0
      });
      
      const serviceIds = provider.services || [];

      if (serviceIds.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      // Get bookings for the provider's services
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('serviceId', 'in', serviceIds),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('date', 'asc')
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookingsData: Booking[] = [];

      bookingsSnapshot.forEach((doc) => {
        const data = doc.data();
        bookingsData.push({
          id: doc.id,
          clientName: data.clientName || 'Unknown',
          clientEmail: data.clientEmail || '',
          clientPhone: data.clientPhone || '',
          serviceName: data.serviceName || 'Unknown Service',
          date: data.date,
          time: data.time || '',
          status: data.status || 'pending',
          notes: data.notes || ''
        });
      });

      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, user?.email, selectedDate]);

  useEffect(() => {
    if (user?.uid) {
      fetchMySchedule();
    }
  }, [fetchMySchedule, user?.uid]);

  // Fetch shift change requests
  useEffect(() => {
    const fetchShiftRequests = async () => {
      if (!user?.uid) return;

      console.log('🔍 SCHEDULE DEBUG: Fetching shift requests for user:', user.uid);

      try {
        const requests = await shiftChangeRequestService.getProviderShiftChangeRequests(user.uid);
        console.log('🔍 SCHEDULE DEBUG: Shift requests result:', requests);
        setShiftRequests(requests);
      } catch (error) {
        console.error('🔍 SCHEDULE DEBUG: ❌ Error fetching shift requests:', error);
        console.error('🔍 SCHEDULE DEBUG: Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: (error as { code?: string })?.code || 'unknown'
        });
      }
    };

    fetchShiftRequests();
  }, [user?.uid]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string) => {
    try {
      return format(new Date(`2000-01-01T${time}`), 'h:mm a');
    } catch {
      return time;
    }
  };

  const getDayName = (date: Date) => {
    return format(date, 'EEEE');
  };

  const getDateDisplay = (date: Date) => {
    return format(date, 'MMMM d, yyyy');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const handleSubmitRequest = async () => {
    if (!user?.uid) return;

    try {
      setSubmitting(true);
      
      // Get provider info
      const userTeamMember = await teamService.getTeamMemberByUserId(user.uid);
      const salonId = userTeamMember?.salonId || user.uid;

      await shiftChangeRequestService.createShiftChangeRequest({
        providerId: user.uid,
        providerName: userTeamMember?.name || user.email || 'Unknown',
        salonId,
        currentShift: requestForm.currentShift,
        requestedShift: requestForm.requestedShift,
        reason: requestForm.reason,
        status: 'pending'
      });

      // Reset form and refresh requests
      setRequestForm({
        currentShift: { date: '', startTime: '', endTime: '' },
        requestedShift: { date: '', startTime: '', endTime: '' },
        reason: ''
      });
      setShowRequestForm(false);
      
      // Refresh requests list
      const requests = await shiftChangeRequestService.getProviderShiftChangeRequests(user.uid);
      setShiftRequests(requests);
    } catch (error) {
      console.error('Error submitting shift change request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Schedule</h1>
          <p className="text-gray-600">View your upcoming appointments and manage your schedule</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'schedule'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="inline w-4 h-4 mr-2" />
                Schedule
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DocumentTextIcon className="inline w-4 h-4 mr-2" />
                Shift Requests
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'schedule' && (
          <>
            {/* Date Navigation */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {getDayName(selectedDate)}, {getDateDisplay(selectedDate)}
                  </div>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Today
                  </button>
                </div>
                
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Schedule Content */}
            {bookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments scheduled</h3>
                <p className="text-gray-600">
                  You don&apos;t have any appointments scheduled for {getDateDisplay(selectedDate)}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{formatTime(booking.time)}</span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {booking.serviceName}
                        </h3>
                        <p className="text-gray-600">{booking.clientName}</p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {booking.clientEmail && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{booking.clientEmail}</span>
                          </div>
                        )}
                        {booking.clientPhone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{booking.clientPhone}</span>
                          </div>
                        )}
                      </div>

                      {booking.notes && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Notes:</span> {booking.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Request Form */}
            {showRequestForm ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Request Shift Change</h3>
                <div className="space-y-6">
                  {/* Current Shift Section */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Current Shift Details</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                          <input
                            type="date"
                            value={requestForm.currentShift.date}
                            onChange={(e) => setRequestForm(prev => ({
                              ...prev,
                              currentShift: { ...prev.currentShift, date: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                          <input
                            type="time"
                            value={requestForm.currentShift.startTime}
                            onChange={(e) => setRequestForm(prev => ({
                              ...prev,
                              currentShift: { ...prev.currentShift, startTime: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                          <input
                            type="time"
                            value={requestForm.currentShift.endTime}
                            onChange={(e) => setRequestForm(prev => ({
                              ...prev,
                              currentShift: { ...prev.currentShift, endTime: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requested Shift Section */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Requested Shift Details (Optional)</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                          <input
                            type="date"
                            value={requestForm.requestedShift.date}
                            onChange={(e) => setRequestForm(prev => ({
                              ...prev,
                              requestedShift: { ...prev.requestedShift, date: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                          <input
                            type="time"
                            value={requestForm.requestedShift.startTime}
                            onChange={(e) => setRequestForm(prev => ({
                              ...prev,
                              requestedShift: { ...prev.requestedShift, startTime: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                          <input
                            type="time"
                            value={requestForm.requestedShift.endTime}
                            onChange={(e) => setRequestForm(prev => ({
                              ...prev,
                              requestedShift: { ...prev.requestedShift, endTime: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reason Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Change *</label>
                    <textarea
                      value={requestForm.reason}
                      onChange={(e) => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Please explain why you need this shift change..."
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowRequestForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitRequest}
                      disabled={submitting || !requestForm.currentShift.date || !requestForm.currentShift.startTime || !requestForm.currentShift.endTime || !requestForm.reason}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Shift Change Requests</h3>
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Request
                </button>
              </div>
            )}

            {/* Requests List */}
            {shiftRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shift change requests</h3>
                <p className="text-gray-600">
                  {showRequestForm ? 'Fill out the form above to submit a request.' : 'You haven&apos;t submitted any shift change requests yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {shiftRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow p-6">
                                         <div className="flex items-start justify-between mb-4">
                       <div>
                         <h4 className="text-lg font-medium text-gray-900">
                           {formatDate(request.currentShift.date)}
                           {request.requestedShift.date && ` → ${formatDate(request.requestedShift.date)}`}
                         </h4>
                         <p className="text-sm text-gray-600 mt-1">
                           {formatTime(request.currentShift.startTime)}-{formatTime(request.currentShift.endTime)}
                           {request.requestedShift.startTime && request.requestedShift.endTime && 
                             ` → ${formatTime(request.requestedShift.startTime)}-${formatTime(request.requestedShift.endTime)}`}
                         </p>
                       </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status === 'pending' ? 'Pending' : 
                         request.status === 'approved' ? 'Approved' : 'Denied'}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Reason:</span> {request.reason}
                        </p>
                      </div>
                      
                      {request.reviewNotes && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Review Notes:</span> {request.reviewNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 