'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useSalonContext } from '@/lib/hooks/useSalonContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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
  createdAt: Timestamp;
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const { salonId: contextSalonId, salonName, isImpersonating } = useSalonContext();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchMyBookings = useCallback(async () => {
    if (!user?.uid || !contextSalonId) return;

    try {
      setLoading(true);
      console.log('🔍 Fetching bookings for salon:', contextSalonId);
      
      // For SuperAdmin context switching, get all bookings for the selected salon
      // For regular users, get their own bookings
      let bookingsQuery;
      
      if (isImpersonating) {
        // SuperAdmin: Get all bookings for the selected salon
        bookingsQuery = query(
          collection(db, 'bookings'),
          where('salonId', '==', contextSalonId),
          orderBy('createdAt', 'desc')
        );
        
        // Add status filter if not 'all'
        if (statusFilter !== 'all') {
          bookingsQuery = query(
            collection(db, 'bookings'),
            where('salonId', '==', contextSalonId),
            where('status', '==', statusFilter),
            orderBy('createdAt', 'desc')
          );
        }
      } else {
        // Regular user: Get their own bookings
        const providerDoc = await getDocs(
          query(
            collection(db, 'providers'),
            where('teamMemberId', '==', user.uid)
          )
        );

        if (providerDoc.empty) {
          setBookings([]);
          setLoading(false);
          return;
        }

        const provider = providerDoc.docs[0].data();
        const serviceIds = provider.services || [];

        if (serviceIds.length === 0) {
          setBookings([]);
          setLoading(false);
          return;
        }

        // Get bookings for the provider's services
        bookingsQuery = query(
          collection(db, 'bookings'),
          where('serviceId', 'in', serviceIds),
          orderBy('createdAt', 'desc')
        );

        // Add status filter if not 'all'
        if (statusFilter !== 'all') {
          bookingsQuery = query(
            collection(db, 'bookings'),
            where('serviceId', '==', statusFilter),
            where('serviceId', 'in', serviceIds),
            orderBy('createdAt', 'desc')
          );
        }
      }

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
          notes: data.notes || '',
          createdAt: data.createdAt || data.date
        });
      });

      console.log(`✅ Found ${bookingsData.length} bookings for salon:`, contextSalonId);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, contextSalonId, statusFilter, isImpersonating]);

  useEffect(() => {
    if (user?.uid && contextSalonId) {
      fetchMyBookings();
    }
  }, [fetchMyBookings, user?.uid, contextSalonId]);

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      setUpdatingStatus(bookingId);
      
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });

      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus }
          : booking
      ));
    } catch (error) {
      console.error('Error updating booking status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatTime = (time: string) => {
    try {
      return format(new Date(`2000-01-01T${time}`), 'h:mm a');
    } catch {
      return time;
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    return format(timestamp.toDate(), 'MMM d, yyyy');
  };

  const formatDateTime = (timestamp: Timestamp) => {
    return format(timestamp.toDate(), 'MMM d, yyyy h:mm a');
  };

  const getStatusOptions = (currentStatus: string) => {
    const allStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    return allStatuses.filter(status => status !== currentStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4 mb-6"></div>
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isImpersonating ? 'Salon Bookings' : 'My Bookings'}
          </h1>
          <p className="text-gray-600">
            {isImpersonating 
              ? `Manage booking requests and appointments for ${salonName}`
              : 'Manage your booking requests and appointments'
            }
          </p>
          {isImpersonating && (
            <div className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              <span>👁️ Viewing as SuperAdmin: {salonName}</span>
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({bookings.filter(b => b.status === 'pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'confirmed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({bookings.filter(b => b.status === 'completed').length})
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {statusFilter === 'all' 
                ? "You don't have any booking requests yet."
                : `You don't have any ${statusFilter} bookings.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{formatDate(booking.date)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{formatTime(booking.time)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(booking.status)}`}
                    >
                      {getStatusIcon(booking.status)}
                      <span className="capitalize">{booking.status}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {booking.serviceName}
                    </h3>
                    <p className="text-gray-600 flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{booking.clientName}</span>
                    </p>
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

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Requested: {formatDateTime(booking.createdAt)}
                    </div>
                    
                    {booking.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          disabled={updatingStatus === booking.id}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {updatingStatus === booking.id ? 'Updating...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          disabled={updatingStatus === booking.id}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {updatingStatus === booking.id ? 'Updating...' : 'Cancel'}
                        </button>
                      </div>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                        disabled={updatingStatus === booking.id}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {updatingStatus === booking.id ? 'Updating...' : 'Mark Complete'}
                      </button>
                    )}
                    
                    {['pending', 'confirmed'].includes(booking.status) && (
                      <select
                        onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                        disabled={updatingStatus === booking.id}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        value=""
                      >
                        <option value="">Change Status</option>
                        {getStatusOptions(booking.status).map(status => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 