import React, { useState } from 'react';
import { getNextSevenDays, formatDisplayDate, formatDate } from '../../utils/dateUtils';
import { TIME_SLOTS } from '../../utils/constants';
import { isTimeSlotPassed } from '../../utils/timeUtils';

interface CalendarProps {
  onTimeSlotClick: (date: string, time: string) => void;
  bookedSlots: { [key: string]: string[] }; // date -> array of booked times
  blockedSlots?: { [key: string]: string[] }; // date -> array of admin blocked times
}

const Calendar: React.FC<CalendarProps> = ({ onTimeSlotClick, bookedSlots, blockedSlots = {} }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const days = getNextSevenDays();

  const isSlotBooked = (date: string, time: string): boolean => {
    return bookedSlots[date]?.includes(time) || false;
  };

  const isSlotBlocked = (date: string, time: string): boolean => {
    return blockedSlots[date]?.includes(time) || false;
  };

  const isSlotPassed = (date: string, time: string): boolean => {
    return isTimeSlotPassed(date, time);
  };

  const isSlotUnavailable = (date: string, time: string): boolean => {
    return isSlotBooked(date, time) || isSlotBlocked(date, time) || isSlotPassed(date, time);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-barber-cream via-white to-barber-cream/50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-barber-gold rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.5 12c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm9 0c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm-4.5 6c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-barber-dark mb-3 tracking-tight">
              Premium Barber Experience
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Book your appointment with Turkey's finest barbers. Professional service, premium experience.
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Date Selection */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-barber-dark mb-6 text-center">
              Choose Your Date
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {days.map((day) => {
                const isSelected = formatDate(selectedDate) === formatDate(day);
                return (
                  <button
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={`group relative px-6 py-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                      isSelected
                        ? 'bg-gradient-to-r from-barber-gold to-yellow-500 text-white shadow-lg shadow-barber-gold/25'
                        : 'bg-white/70 text-gray-700 hover:bg-white border border-gray-200 hover:border-barber-gold/30 hover:shadow-md'
                    }`}
                  >
                    <div className={`text-base font-semibold ${isSelected ? 'text-white' : 'text-barber-dark'}`}>
                      {formatDisplayDate(day)}
                    </div>
                    <div className={`text-sm ${isSelected ? 'text-white/90' : 'text-gray-500'} mt-1`}>
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-barber-gold to-yellow-500 opacity-20 animate-pulse"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-barber-dark mb-6 text-center">
              Available Times - {formatDisplayDate(selectedDate)}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {TIME_SLOTS.map((time) => {
                const dateString = formatDate(selectedDate);
                const isBooked = isSlotBooked(dateString, time);
                const isBlocked = isSlotBlocked(dateString, time);
                const isPassed = isSlotPassed(dateString, time);
                const isUnavailable = isSlotUnavailable(dateString, time);
                
                let bgColor = 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 hover:border-blue-400 hover:scale-105 hover:shadow-md active:scale-95';
                let statusText = '';
                
                if (isPassed || isBooked || isBlocked) {
                  bgColor = 'bg-gray-300 text-gray-500 cursor-not-allowed';
                  if (isPassed) statusText = 'Past';
                  else if (isBooked) statusText = 'Booked';
                  else if (isBlocked) statusText = 'Blocked';
                }
                
                return (
                  <button
                    key={time}
                    onClick={() => !isUnavailable && onTimeSlotClick(dateString, time)}
                    disabled={isUnavailable}
                    className={`group relative p-4 rounded-xl font-medium transition-all duration-300 transform ${bgColor}`}
                  >
                    <div className="text-lg font-semibold">{time}</div>
                    {statusText && (
                      <div className="text-xs font-medium mt-1 opacity-75">{statusText}</div>
                    )}
                    {!isUnavailable && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 flex items-center justify-center gap-6">
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded"></span>
                Available
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 bg-gray-300 rounded"></span>
                Unavailable
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;