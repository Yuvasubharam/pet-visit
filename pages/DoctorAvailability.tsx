import React, { useState, useEffect } from 'react';
import { doctorAvailabilityService } from '../services/doctorApi';
import type { DoctorAvailability as AvailabilityType } from '../types';
import QuickAddAvailabilityModal from '../components/QuickAddAvailabilityModal';

interface DoctorAvailabilityProps {
  onBack: () => void;
  doctorId: string | null;
}

const DoctorAvailability: React.FC<DoctorAvailabilityProps> = ({ onBack, doctorId }) => {
  const [activeTab, setActiveTab] = useState<'clinic' | 'home' | 'online'>('clinic');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState<AvailabilityType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [doctorId, selectedDate, activeTab]);

  const loadAvailability = async () => {
    if (!doctorId) return;

    try {
      setLoading(true);
      const dateString = selectedDate.toISOString().split('T')[0];
      const availability = await doctorAvailabilityService.getDoctorAvailability(doctorId, {
        date: dateString,
        slot_type: activeTab,
      });
      setSlots(availability || []);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async () => {
    if (!doctorId) return;

    const startTime = prompt('Enter start time (HH:MM format, e.g., 09:00):');
    const endTime = prompt('Enter end time (HH:MM format, e.g., 10:00):');
    const capacity = prompt('Enter capacity (number of pets):');

    if (!startTime || !endTime || !capacity) return;

    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      await doctorAvailabilityService.createAvailabilitySlot({
        doctor_id: doctorId,
        date: dateString,
        start_time: startTime,
        end_time: endTime,
        slot_type: activeTab,
        capacity: parseInt(capacity),
        booked_count: 0,
        is_active: true,
      });

      loadAvailability();
    } catch (error) {
      console.error('Error creating slot:', error);
      alert('Failed to create slot');
    }
  };

  const handleSlotAdd = () => {
    setShowQuickAddModal(true);
  };

  const handleQuickAddSubmit = async (data: {
    selectedWeekdays: number[];
    selectedTimeSlots: string[];
    capacity: number;
  }) => {
    if (!doctorId) return;

    try {
      setCreating(true);
      await doctorAvailabilityService.createWeeklyRecurringAvailability({
        doctor_id: doctorId,
        weekdays: data.selectedWeekdays,
        time_slots: data.selectedTimeSlots,
        slot_type: activeTab,
        capacity: data.capacity,
        weeks_ahead: 4,
      });

      setShowQuickAddModal(false);
      loadAvailability();
      alert(`Successfully created ${data.selectedWeekdays.length * data.selectedTimeSlots.length} slots per week for 4 weeks!`);
    } catch (error) {
      console.error('Error creating availability:', error);
      alert('Failed to create slots. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;

    try {
      await doctorAvailabilityService.deleteAvailabilitySlot(slotId);
      loadAvailability();
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert('Failed to delete slot');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDayName = (offset: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDateNumber = (offset: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + offset);
    return date.getDate();
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-surface-light dark:bg-surface-dark px-4 py-4 z-20 shadow-sm border-b border-gray-100 dark:border-slate-800">
        <button
          onClick={onBack}
          className="text-slate-900 dark:text-dark flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 white:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-dark tracking-tight">
          Availability & Slots
        </h1>
        <button className="text-slate-900 dark:text-dark flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 white:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-24">
        {/* Tab Switcher */}
        <div className="bg-surface-light dark:bg-surface-dark pt-2 pb-4 px-4 shadow-sm z-10 sticky top-0">
          <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('clinic')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'clinic'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              <span>Clinic</span>
            </button>
            <button
              onClick={() => setActiveTab('home')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'home'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">home_health</span>
              <span>Home</span>
            </button>
            <button
              onClick={() => setActiveTab('online')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'online'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">videocam</span>
              <span>Online</span>
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="py-6 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-dark uppercase tracking-wider">
              {formatDate(selectedDate)}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() - 7);
                  setSelectedDate(newDate);
                }}
                className="p-1 text-dark rounded-full hover:text-white dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() + 7);
                  setSelectedDate(newDate);
                }}
                className="p-1 hover:text-white dark:hover:text-white rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Date Selector */}
          <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar pb-2">
            {[0, 1, 2, 3, 4].map((offset) => (
              <button
                key={offset}
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() + offset);
                  setSelectedDate(newDate);
                }}
                className={`flex flex-col items-center gap-1 min-w-[3.5rem] p-2 rounded-2xl cursor-pointer transition-colors ${offset === 0
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark'
                  : 'bg-white dark:bg-surface-dark border border-gray-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                  }`}
              >
                <span className={`text-xs font-medium ${offset === 0 ? 'opacity-80' : ''}`}>
                  {getDayName(offset)}
                </span>
                <span className={`text-xl font-bold ${offset === 0 ? 'text-white' : 'text-slate-900 dark:text-slate-300'}`}>
                  {getDateNumber(offset)}
                </span>
                {offset === 0 && <div className="size-1.5 rounded-full bg-white mt-1"></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Header */}
        <div className="px-5 mb-4 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Schedule • {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSlotAdd}
              className="text-xs font-bold text-white bg-primary hover:bg-[#013d63] px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md shadow-primary/30 transition-all"
            >
              <span className="material-symbols-outlined text-sm">event_available</span>
              Slot Add
            </button>
            <button
              onClick={handleQuickAdd}
              className="text-xs font-bold text-primary flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Quick Add
            </button>
          </div>
        </div>

        {/* Time Slots */}
        <div className="px-4 relative space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-slate-500">Loading slots...</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-slate-800 mx-auto mb-3 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-slate-400">calendar_month</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">No slots for this date</p>
              <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Click "Slot Add" to create recurring slots</p>
            </div>
          ) : (
            slots.map((slot) => (
              <div key={slot.id} className="flex gap-4 group">
                <div className="w-14 pt-2 text-right">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {slot.start_time}
                  </span>
                  <span className="block text-[10px] text-slate-400 uppercase">
                    {parseInt(slot.start_time.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                  </span>
                </div>
                <div className="flex-1 relative">
                  <div className="bg-white dark:bg-surface-dark rounded-xl p-3 border-l-4 border-primary shadow-sm ring-1 ring-gray-100 dark:ring-slate-700 flex flex-col gap-2 relative cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {slot.start_time} - {slot.end_time}
                          </span>
                          <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {slot.capacity - slot.booked_count} left
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                          <span className="material-symbols-outlined text-[14px]">groups</span>
                          <span>
                            Capacity: {slot.booked_count}/{slot.capacity} pets
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                    <div className="absolute right-2 bottom-2 text-slate-300">
                      <span className="material-symbols-outlined text-[14px] rotate-90">
                        drag_handle
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/85 dark:bg-surface-dark/85 backdrop-blur-sm border-t border-gray-100 dark:border-slate-800 z-40">
        <button className="w-full bg-primary hover:bg-[#013d63] text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">save</span>
          <span>Save Availability</span>
        </button>
      </div>

      {/* Quick Add Modal */}
      <QuickAddAvailabilityModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onSubmit={handleQuickAddSubmit}
        slotType={activeTab}
      />

      {/* Loading Overlay */}
      {creating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-2xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-slate-900 dark:text-white font-bold">Creating slots...</p>
            <p className="text-slate-500 text-sm mt-1">This may take a moment</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAvailability;
