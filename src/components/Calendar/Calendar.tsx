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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/5 to-indigo-400/10"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className="relative max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-xl shadow-blue-500/25 transform hover:scale-110 transition-all duration-500 hover:rotate-12 animate-pulse">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.5 12c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm9 0c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm-4.5 6c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z"/>
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4 tracking-tight">
              Book Your Perfect Cut
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-4">
              Choose your preferred date and time for a great haircut experience.
            </p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/40 p-4 sm:p-6 lg:p-10 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent rounded-2xl sm:rounded-3xl"></div>
          <div className="relative z-10">
          {/* Date Selection */}
          <div className="mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent mb-6 sm:mb-8 text-center">
              Choose Your Date
            </h2>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 animate-fadeIn">
              {days.map((day) => {
                const isSelected = formatDate(selectedDate) === formatDate(day);
                return (
                  <button
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={`group relative px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/25 border border-blue-400/50'
                        : 'bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white/90 border border-slate-200/50 hover:border-blue-300/50 hover:shadow-lg'
                    }`}
                  >
                    <div className={`text-sm sm:text-base lg:text-lg font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {formatDisplayDate(day)}
                    </div>
                    <div className={`text-xs sm:text-sm ${isSelected ? 'text-white/90' : 'text-slate-500'} mt-1 font-medium`}>
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-indigo-400/20 animate-pulse"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent mb-6 sm:mb-8 text-center">
              Available Times - {formatDisplayDate(selectedDate)}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
              {TIME_SLOTS.map((time) => {
                const dateString = formatDate(selectedDate);
                const isBooked = isSlotBooked(dateString, time);
                const isBlocked = isSlotBlocked(dateString, time);
                const isPassed = isSlotPassed(dateString, time);
                const isUnavailable = isSlotUnavailable(dateString, time);
                
                let cardStyles = 'bg-gradient-to-br from-white to-blue-50/50 text-blue-700 hover:from-blue-50 hover:to-blue-100 border border-blue-200/50 hover:border-blue-400/50 hover:scale-105 hover:shadow-xl shadow-blue-100/50 backdrop-blur-sm';
                let statusText = '';
                let statusIcon = '';
                
                if (isPassed || isBooked || isBlocked) {
                  cardStyles = 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 cursor-not-allowed border border-slate-300/50';
                  if (isPassed) {
                    statusText = 'Past';
                    statusIcon = '⏰';
                  } else if (isBooked) {
                    statusText = 'Booked';
                    statusIcon = '✅';
                  } else if (isBlocked) {
                    statusText = 'Blocked';
                    statusIcon = '🚫';
                  }
                }
                
                return (
                  <button
                    key={time}
                    onClick={() => !isUnavailable && onTimeSlotClick(dateString, time)}
                    disabled={isUnavailable}
                    className={`group relative p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 transform ${cardStyles}`}
                  >
                    <div className="text-sm sm:text-base lg:text-lg font-bold mb-1">{time}</div>
                    {statusText && (
                      <div className="flex items-center justify-center gap-1 text-xs sm:text-xs font-semibold mt-1 sm:mt-2">
                        <span>{statusIcon}</span>
                        <span>{statusText}</span>
                      </div>
                    )}
                    {!isUnavailable && (
                      <>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                        <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg shadow-green-400/50"></div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-8 bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/40">
              <span className="flex items-center gap-3">
                <span className="w-5 h-5 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-lg shadow-sm"></span>
                <span className="text-sm font-medium text-slate-700">Available</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="w-5 h-5 bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300 rounded-lg"></span>
                <span className="text-sm font-medium text-slate-700">Unavailable</span>
              </span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;