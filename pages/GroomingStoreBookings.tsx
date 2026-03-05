import React, { useState, useEffect } from 'react';
import { groomingStoreBookingService } from '../services/groomingStoreApi';
import { Booking } from '../types';

interface GroomingStoreBookingsProps {
  storeId: string | null;
  onBack: () => void;
}

const GroomingStoreBookings: React.FC<GroomingStoreBookingsProps> = ({ storeId, onBack }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (storeId) {
      loadBookings();
    }
  }, [storeId]);

  useEffect(() => {
    filterBookings();
  }, [activeTab, bookings]);

  const loadBookings = async () => {
    if (!storeId) return;

    try {
      setLoading(true);
      const data = await groomingStoreBookingService.getStoreBookings(storeId);
      console.log('Loaded bookings data:', data);
      if (data && data.length > 0) {
        console.log('First booking sample:', data[0]);
      }
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      alert('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (activeTab === 'upcoming') {
      filtered = bookings.filter(b => b.status === 'upcoming' || b.status === 'pending');
    } else if (activeTab === 'completed') {
      filtered = bookings.filter(b => b.status === 'completed');
    }

    setFilteredBookings(filtered);
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: 'upcoming' | 'completed' | 'cancelled') => {
    try {
      await groomingStoreBookingService.updateBookingStatus(bookingId, newStatus);

      // Reload bookings
      await loadBookings();

      alert(`Booking status updated to ${newStatus}`);
      setShowDetails(false);
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 max-w-md mx-auto shadow-xl overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-slate-700">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-black text-primary tracking-tight">Bookings</h1>
              <p className="text-xs text-slate-500 font-medium">{filteredBookings.length} total</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Upcoming ({bookings.filter(b => b.status === 'upcoming' || b.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'completed'
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Completed ({bookings.filter(b => b.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-slate-400 text-4xl">event_busy</span>
            </div>
            <p className="text-slate-600 font-medium">No bookings found</p>
            <p className="text-sm text-slate-400 mt-1">Bookings will appear here when customers book your services</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <button
              key={booking.id}
              onClick={() => {
                console.log('Selected booking:', booking);
                console.log('Pets data:', booking.pets);
                console.log('Users data:', booking.users);
                console.log('Addresses data:', booking.addresses);
                console.log('Grooming packages data:', booking.grooming_packages);
                setSelectedBooking(booking);
                setShowDetails(true);
              }}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">
                      {booking.booking_type === 'home' ? 'home' : 'store'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {(Array.isArray(booking.pets) ? booking.pets[0]?.name : booking.pets?.name) || 'Pet'} - {(Array.isArray(booking.pets) ? booking.pets[0]?.species : booking.pets?.species) || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(Array.isArray(booking.grooming_packages) ? booking.grooming_packages[0]?.name : booking.grooming_packages?.name) || booking.package_type}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  <span>{formatDate(booking.date)} at {booking.time}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="material-symbols-outlined text-sm">
                    {booking.booking_type === 'home' ? 'home' : 'store'}
                  </span>
                  <span>{booking.booking_type === 'home' ? 'Home Visit' : 'Clinic Visit'}</span>
                </div>

                {booking.contact_number && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="material-symbols-outlined text-sm">phone</span>
                    <span>{booking.contact_number}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-medium text-slate-500">Amount</span>
                  <span className="text-lg font-black text-primary">₹{booking.payment_amount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </main>

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowDetails(false)}>
          <div
            className="bg-white rounded-t-[32px] w-full max-w-md p-6 space-y-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Booking Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-slate-700">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Pet Info */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pet Information</p>
                <p className="text-lg font-black text-slate-900">
                  {(Array.isArray(selectedBooking.pets) ? selectedBooking.pets[0]?.name : selectedBooking.pets?.name) || 'Unknown Pet'}
                </p>
                <p className="text-sm text-slate-600">
                  {(Array.isArray(selectedBooking.pets) ? selectedBooking.pets[0]?.species : selectedBooking.pets?.species) || 'Species not specified'}
                </p>
                {(Array.isArray(selectedBooking.pets) ? selectedBooking.pets[0]?.breed : selectedBooking.pets?.breed) && (
                  <p className="text-sm text-slate-500">Breed: {Array.isArray(selectedBooking.pets) ? selectedBooking.pets[0]?.breed : selectedBooking.pets?.breed}</p>
                )}
              </div>

              {/* Owner Info */}
              {(selectedBooking.users || (Array.isArray(selectedBooking.users) && selectedBooking.users.length > 0)) && (
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Owner Information</p>
                  <p className="text-lg font-black text-slate-900">
                    {(Array.isArray(selectedBooking.users) ? selectedBooking.users[0]?.name : selectedBooking.users?.name) || 'Unknown Owner'}
                  </p>
                  {(Array.isArray(selectedBooking.users) ? selectedBooking.users[0]?.email : selectedBooking.users?.email) && (
                    <p className="text-sm text-slate-600">{Array.isArray(selectedBooking.users) ? selectedBooking.users[0]?.email : selectedBooking.users?.email}</p>
                  )}
                  {(Array.isArray(selectedBooking.users) ? selectedBooking.users[0]?.phone : selectedBooking.users?.phone) && (
                    <p className="text-sm text-slate-500">Phone: {Array.isArray(selectedBooking.users) ? selectedBooking.users[0]?.phone : selectedBooking.users?.phone}</p>
                  )}
                </div>
              )}

              {/* Package Info */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Package</p>
                <p className="text-lg font-black text-slate-900">
                  {(Array.isArray(selectedBooking.grooming_packages) ? selectedBooking.grooming_packages[0]?.name : selectedBooking.grooming_packages?.name) || selectedBooking.package_type || 'Package'}
                </p>
                <p className="text-sm text-slate-600">
                  {(Array.isArray(selectedBooking.grooming_packages) ? selectedBooking.grooming_packages[0]?.description : selectedBooking.grooming_packages?.description) || 'No description available'}
                </p>
              </div>

              {/* Date & Time */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Schedule</p>
                <p className="text-lg font-black text-slate-900">{formatDate(selectedBooking.date)}</p>
                <p className="text-sm text-slate-600">Time: {selectedBooking.time}</p>
              </div>

              {/* Service Type */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Service Type</p>
                <p className="text-lg font-black text-slate-900">
                  {selectedBooking.booking_type === 'home' ? 'Home Visit' : 'Clinic Visit'}
                </p>
                {selectedBooking.booking_type === 'home' && (() => {
                  const address = Array.isArray(selectedBooking.addresses) ? selectedBooking.addresses[0] : selectedBooking.addresses;
                  if (!address) return null;

                  return (
                    <>
                      <p className="text-sm text-slate-600 mt-2">
                        {address.full_address ||
                         `${address.flat_number || ''}, ${address.street || ''}, ${address.city || ''}`}
                      </p>

                      {/* Map and Navigate Button */}
                      {address.latitude && address.longitude && (
                        <div className="mt-3 space-y-2">
                          {/* Google Maps Iframe */}
                          <div className="rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm">
                            <iframe
                              src={`https://maps.google.com/maps?q=${address.latitude},${address.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                              width="100%"
                              height="200"
                              style={{ border: 0 }}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Location Map"
                            />
                          </div>

                          {/* Navigate Button */}
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors"
                          >
                            <span className="material-symbols-outlined">directions</span>
                            Navigate to Location
                          </a>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Contact */}
              {selectedBooking.contact_number && (
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black text-slate-900">{selectedBooking.contact_number}</p>
                    <a
                      href={`tel:${selectedBooking.contact_number}`}
                      className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-white text-xl">call</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Payment */}
              <div className="bg-primary/5 rounded-2xl p-4 border-2 border-primary/20">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Payment</p>
                <p className="text-2xl font-black text-primary">₹{selectedBooking.payment_amount?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-slate-600 mt-1">Status: {selectedBooking.payment_status}</p>
              </div>

              {/* Status Actions */}
              {selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <p className="text-sm font-bold text-slate-700">Update Status</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'completed')}
                      className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-colors"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'cancelled')}
                      className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroomingStoreBookings;
