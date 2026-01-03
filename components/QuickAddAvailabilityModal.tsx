import React, { useState } from 'react';

interface QuickAddAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    selectedWeekdays: number[];
    selectedTimeSlots: string[];
    capacity: number;
  }) => void;
  slotType: 'clinic' | 'home' | 'online';
}

const QuickAddAvailabilityModal: React.FC<QuickAddAvailabilityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  slotType,
}) => {
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [capacity, setCapacity] = useState<number>(1);

  const weekdays = [
    { label: 'S', day: 0, name: 'Sunday' },
    { label: 'M', day: 1, name: 'Monday' },
    { label: 'T', day: 2, name: 'Tuesday' },
    { label: 'W', day: 3, name: 'Wednesday' },
    { label: 'T', day: 4, name: 'Thursday' },
    { label: 'F', day: 5, name: 'Friday' },
    { label: 'S', day: 6, name: 'Saturday' },
  ];

  // Generate time slots from 8:00 AM to 8:00 PM with 30-minute intervals
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 20) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleTimeSlot = (time: string) => {
    setSelectedTimeSlots((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleSubmit = () => {
    if (selectedWeekdays.length === 0) {
      alert('Please select at least one weekday');
      return;
    }
    if (selectedTimeSlots.length === 0) {
      alert('Please select at least one time slot');
      return;
    }
    if (capacity < 1) {
      alert('Capacity must be at least 1');
      return;
    }

    onSubmit({
      selectedWeekdays,
      selectedTimeSlots,
      capacity,
    });

    // Reset form
    setSelectedWeekdays([]);
    setSelectedTimeSlots([]);
    setCapacity(1);
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minute} ${period}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-dark">
            Quick Add Availability
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Slot Type Info */}
          <div className="bg-primary/10 rounded-xl p-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">
              {slotType === 'clinic' ? 'storefront' : slotType === 'home' ? 'home_health' : 'videocam'}
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-dark">
                {slotType.charAt(0).toUpperCase() + slotType.slice(1)} Visit
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Setting availability for {slotType} consultations
              </p>
            </div>
          </div>

          {/* Weekday Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-dark mb-3">
              Select Days
            </label>
            <div className="flex justify-between gap-2">
              {weekdays.map((weekday) => (
                <button
                  key={weekday.day}
                  onClick={() => toggleWeekday(weekday.day)}
                  className={`flex-1 aspect-square rounded-xl font-bold text-sm transition-all ${
                    selectedWeekdays.includes(weekday.day)
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                      : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                  title={weekday.name}
                >
                  {weekday.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-dark mb-3">
              Select Time Slots
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => toggleTimeSlot(time)}
                  className={`px-3 py-2.5 rounded-lg font-medium text-xs transition-all ${
                    selectedTimeSlots.includes(time)
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {formatTime(time)}
                </button>
              ))}
            </div>
          </div>

          {/* Capacity Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-dark mb-3">
              Capacity per Slot
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCapacity(Math.max(1, capacity - 1))}
                className="h-10 w-10 rounded-full bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined">remove</span>
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-bold text-slate-900 dark:text-dark">
                  {capacity}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  pets per slot
                </p>
              </div>
              <button
                onClick={() => setCapacity(capacity + 1)}
                className="h-10 w-10 rounded-full bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>

          {/* Summary */}
          {selectedWeekdays.length > 0 && selectedTimeSlots.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">
                Summary
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Creating <span className="font-bold">{selectedWeekdays.length} × {selectedTimeSlots.length} = {selectedWeekdays.length * selectedTimeSlots.length} slots</span>
                <br />
                {capacity} pet{capacity > 1 ? 's' : ''} per slot
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-surface-dark">
          <button
            onClick={handleSubmit}
            disabled={selectedWeekdays.length === 0 || selectedTimeSlots.length === 0}
            className="w-full bg-primary hover:bg-[#013d63] text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span>Create Slots</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAddAvailabilityModal;
