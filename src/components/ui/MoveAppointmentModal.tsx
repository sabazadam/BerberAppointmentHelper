import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getNextSevenDays, formatDisplayDate, formatDate } from '../../utils/dateUtils';
import { TIME_SLOTS } from '../../utils/constants';
import { isTimeSlotPassed } from '../../utils/timeUtils';

interface MoveAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newDate: string, newTime: string) => void;
  currentDate: string;
  currentTime: string;
  customerName: string;
  bookedSlots: { [key: string]: string[] };
  blockedSlots?: { [key: string]: string[] };
}

const MoveAppointmentModal: React.FC<MoveAppointmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentDate,
  currentTime,
  customerName,
  bookedSlots,
  blockedSlots = {}
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const days = getNextSevenDays();

  const isSlotUnavailable = (date: string, time: string): boolean => {
    const dateString = formatDate(new Date(date));
    const isBooked = bookedSlots[dateString]?.includes(time) || false;
    const isBlocked = blockedSlots[dateString]?.includes(time) || false;
    const isPassed = isTimeSlotPassed(dateString, time);
    const isCurrent = dateString === currentDate && time === currentTime;
    
    return isBooked || isBlocked || isPassed || isCurrent;
  };

  const handleConfirm = () => {
    if (selectedTime) {
      const newDateString = formatDate(selectedDate);
      onConfirm(newDateString, selectedTime);
      setSelectedTime('');
    }
  };

  const handleClose = () => {
    setSelectedTime('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-2xl font-bold">
                  Move Appointment
                </Dialog.Title>
                <button
                  onClick={handleClose}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <p className="text-white/90 mt-2">Select a new time for {customerName}'s appointment</p>
            </div>

            <div className="p-8">
              {/* Current Appointment Info */}
              <div className="mb-8 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <p className="text-blue-600 font-medium text-sm mb-1">Current Appointment</p>
                <p className="text-blue-900 font-semibold text-lg">
                  {currentDate} at {currentTime}
                </p>
              </div>

              {/* Date Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select New Date</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {days.map((day) => {
                    const isSelected = formatDate(selectedDate) === formatDate(day);
                    return (
                      <button
                        key={day.toString()}
                        onClick={() => {
                          setSelectedDate(day);
                          setSelectedTime(''); // Reset time selection when date changes
                        }}
                        className={`px-6 py-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                          isSelected
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="text-base font-semibold">
                          {formatDisplayDate(day)}
                        </div>
                        <div className="text-sm opacity-75 mt-1">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Select New Time - {formatDisplayDate(selectedDate)}
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {TIME_SLOTS.map((time) => {
                    const dateString = formatDate(selectedDate);
                    const isUnavailable = isSlotUnavailable(dateString, time);
                    const isSelected = selectedTime === time;
                    
                    return (
                      <button
                        key={time}
                        onClick={() => !isUnavailable && setSelectedTime(time)}
                        disabled={isUnavailable}
                        className={`p-3 rounded-xl font-medium transition-all duration-300 transform ${
                          isSelected
                            ? 'bg-blue-500 text-white shadow-lg scale-105'
                            : isUnavailable
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 hover:scale-105'
                        }`}
                      >
                        <div className="text-base font-semibold">{time}</div>
                        {isUnavailable && (
                          <div className="text-xs mt-1">Unavailable</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Time Preview */}
              {selectedTime && (
                <div className="mb-8 p-4 bg-green-50 rounded-2xl border border-green-200">
                  <p className="text-green-600 font-medium text-sm mb-1">New Appointment Time</p>
                  <p className="text-green-900 font-semibold text-lg">
                    {formatDate(selectedDate)} at {selectedTime}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedTime}
                  className={`flex-1 px-6 py-3 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] ${
                    selectedTime
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Confirm Move
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default MoveAppointmentModal;