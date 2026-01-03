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

  const handleQuickAdd = () => {
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
      alert(\`Successfully created \${data.selectedWeekdays.length * data.selectedTimeSlots.length} slots!\`);
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
      <QuickAddAvailabilityModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onSubmit={handleQuickAddSubmit}
        slotType={activeTab}
      />
      <div>Rest of component...</div>
    </div>
  );
};

export default DoctorAvailability;
