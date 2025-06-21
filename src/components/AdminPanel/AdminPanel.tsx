import React, { useState, useEffect } from 'react';
import { Appointment } from '../../types';
import { appointmentService } from '../../services/appointmentService';
import { adminService } from '../../services/adminService';
import { formatDisplayDate, formatDate, getNextSevenDays } from '../../utils/dateUtils';
import { getCurrentMonthStats, isAppointmentPast, isPendingAppointmentExpired } from '../../utils/timeUtils';
import ConfirmModal from '../ui/ConfirmModal';
import MoveAppointmentModal from '../ui/MoveAppointmentModal';
import ConflictModal from '../ui/ConflictModal';

const AdminPanel: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [appointmentToMove, setAppointmentToMove] = useState<Appointment | null>(null);
  const [appointmentToMarkNoShow, setAppointmentToMarkNoShow] = useState<Appointment | null>(null);
  const [conflictingAppointments, setConflictingAppointments] = useState<Appointment[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{ [key: string]: string[] }>({});
  const days = getNextSevenDays();

  useEffect(() => {
    // Auto-decline expired appointments on component mount
    appointmentService.autoDeclineExpiredAppointments();
    
    const unsubscribe = appointmentService.subscribeToAppointments((updatedAppointments) => {
      setAppointments(updatedAppointments);
      
      // Update booked slots for move modal
      const newBookedSlots: { [key: string]: string[] } = {};
      updatedAppointments
        .filter(apt => apt.status === 'approved')
        .forEach(apt => {
          if (!newBookedSlots[apt.date]) {
            newBookedSlots[apt.date] = [];
          }
          newBookedSlots[apt.date].push(apt.time);
        });
      setBookedSlots(newBookedSlots);
      
      // Check for conflicts
      checkForConflicts(updatedAppointments);
      
      setLoading(false);
    });

    // Set up periodic auto-decline check (every 5 minutes)
    const autoDeclineInterval = setInterval(() => {
      appointmentService.autoDeclineExpiredAppointments();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      unsubscribe();
      clearInterval(autoDeclineInterval);
    };
  }, []);

  // Check for time slot conflicts in pending appointments
  const checkForConflicts = (appointments: Appointment[]) => {
    const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
    const conflicts: { [key: string]: Appointment[] } = {};
    
    pendingAppointments.forEach(apt => {
      const timeKey = `${apt.date}-${apt.time}`;
      if (!conflicts[timeKey]) {
        conflicts[timeKey] = [];
      }
      conflicts[timeKey].push(apt);
    });
    
    // Find the first conflict with multiple pending appointments
    const conflictKey = Object.keys(conflicts).find(key => conflicts[key].length > 1);
    if (conflictKey && conflicts[conflictKey].length > 1) {
      setConflictingAppointments(conflicts[conflictKey]);
    } else {
      setConflictingAppointments([]);
    }
  };

  // Get conflicting appointments for a specific appointment
  const getConflictingAppointments = (appointment: Appointment): Appointment[] => {
    return appointments.filter(apt => 
      apt.id !== appointment.id &&
      apt.status === 'pending' &&
      apt.date === appointment.date &&
      apt.time === appointment.time
    );
  };

  const handleStatusUpdate = async (appointmentId: string, status: 'approved' | 'rejected') => {
    try {
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (!appointment) return;

      // If approving, check for conflicts and auto-reject others
      if (status === 'approved') {
        const conflicts = getConflictingAppointments(appointment);
        if (conflicts.length > 0) {
          // Reject all conflicting appointments
          await Promise.all(conflicts.map(conflictApt => 
            appointmentService.updateAppointmentStatus(conflictApt.id!, 'rejected')
          ));
        }
      }

      // Update the selected appointment
      await appointmentService.updateAppointmentStatus(appointmentId, status);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Failed to update appointment status. Please try again.');
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return;
    
    try {
      await adminService.cancelAppointment(appointmentToCancel.id!);
      setAppointmentToCancel(null);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
    }
  };

  const handleMoveAppointment = async (newDate: string, newTime: string) => {
    if (!appointmentToMove) return;
    
    try {
      await adminService.moveAppointment(appointmentToMove.id!, newDate, newTime);
      setAppointmentToMove(null);
    } catch (error) {
      console.error('Error moving appointment:', error);
      alert('Failed to move appointment. Please try again.');
    }
  };

  const handleMarkNoShow = async () => {
    if (!appointmentToMarkNoShow) return;
    
    try {
      await adminService.markNoShow(appointmentToMarkNoShow.id!);
      setAppointmentToMarkNoShow(null);
    } catch (error) {
      console.error('Error marking appointment as no-show:', error);
      alert('Failed to mark appointment as no-show. Please try again.');
    }
  };

  const handleResolveConflict = async (keepAppointmentId: string, deleteAppointmentIds: string[]) => {
    try {
      // Delete the conflicting appointments
      await Promise.all(deleteAppointmentIds.map(id => adminService.deleteAppointment(id)));
      setConflictingAppointments([]);
    } catch (error) {
      console.error('Error resolving conflict:', error);
      alert('Failed to resolve conflict. Please try again.');
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  // Analytics for selected date
  const getDateAnalytics = (date: Date) => {
    const dateString = formatDate(date);
    const dayAppointments = appointments.filter(apt => 
      apt.date === dateString && apt.status === 'approved'
    );
    
    const totalReservations = dayAppointments.length;
    const totalIncome = dayAppointments.reduce((sum, apt) => sum + apt.totalPrice, 0);
    const totalServices = dayAppointments.reduce((sum, apt) => sum + apt.services.length, 0);
    
    return {
      totalReservations,
      totalIncome,
      totalServices,
      appointments: dayAppointments
    };
  };

  const selectedDateAnalytics = getDateAnalytics(selectedDate);

  // Monthly analytics
  const monthlyStats = getCurrentMonthStats(appointments);

  // Overall analytics
  const overallAnalytics = {
    totalAppointments: appointments.length,
    pendingAppointments: appointments.filter(apt => apt.status === 'pending').length,
    approvedAppointments: appointments.filter(apt => apt.status === 'approved').length,
    rejectedAppointments: appointments.filter(apt => apt.status === 'rejected').length,
    totalRevenue: appointments.filter(apt => apt.status === 'approved').reduce((sum, apt) => sum + apt.totalPrice, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L10 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'approved':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600 text-lg">Manage barber appointments and bookings</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-500">{monthlyStats.monthName} {monthlyStats.year} Revenue</p>
                <p className="text-3xl font-bold text-green-600">{monthlyStats.totalRevenue} TL</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{monthlyStats.monthName} Appointments</p>
                <p className="text-3xl font-bold text-blue-600">{monthlyStats.totalAppointments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Date Analytics */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Daily Analytics</h2>
          
          {/* Date Selection */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {days.map((day) => {
              const isSelected = formatDate(selectedDate) === formatDate(day);
              const dayStats = getDateAnalytics(day);
              
              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`relative px-6 py-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                      : 'bg-white/70 text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <div className={`text-base font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {formatDisplayDate(day)}
                  </div>
                  <div className={`text-sm ${isSelected ? 'text-white/90' : 'text-gray-500'} mt-1`}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  {dayStats.totalReservations > 0 && (
                    <div className={`text-xs font-medium mt-1 ${isSelected ? 'text-white/80' : 'text-purple-600'}`}>
                      {dayStats.totalReservations} bookings
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Date Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-blue-600 font-medium text-sm">Total Reservations</p>
                  <p className="text-3xl font-bold text-blue-700">{selectedDateAnalytics.totalReservations}</p>
                  <p className="text-blue-600 text-sm">{formatDisplayDate(selectedDate)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-green-600 font-medium text-sm">Total Income</p>
                  <p className="text-3xl font-bold text-green-700">{selectedDateAnalytics.totalIncome} TL</p>
                  <p className="text-green-600 text-sm">From approved bookings</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-purple-600 font-medium text-sm">Total Services</p>
                  <p className="text-3xl font-bold text-purple-700">{selectedDateAnalytics.totalServices}</p>
                  <p className="text-purple-600 text-sm">Services booked</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 mb-8">
          <div className="flex gap-2">
            {[
              { key: 'pending', label: 'Pending', count: appointments.filter(a => a.status === 'pending').length },
              { key: 'approved', label: 'Approved', count: appointments.filter(a => a.status === 'approved').length },
              { key: 'rejected', label: 'Rejected', count: appointments.filter(a => a.status === 'rejected').length },
              { key: 'all', label: 'All', count: appointments.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  filter === tab.key
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  filter === tab.key ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-500">
                {filter === 'pending' && 'No pending appointments at the moment.'}
                {filter === 'approved' && 'No approved appointments yet.'}
                {filter === 'rejected' && 'No rejected appointments.'}
                {filter === 'all' && 'No appointments have been submitted yet.'}
              </p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => {
              const conflicts = getConflictingAppointments(appointment);
              const hasConflict = conflicts.length > 0;
              const isExpiringSoon = appointment.status === 'pending' && isPendingAppointmentExpired(appointment.date, appointment.time);
              
              return (
                <div key={appointment.id} className={`bg-white rounded-2xl shadow-lg border p-6 hover:shadow-xl transition-all duration-300 ${
                  isExpiringSoon ? 'border-red-400 bg-red-50' :
                  hasConflict ? 'border-yellow-400 bg-yellow-50' : 
                  'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Expired Warning */}
                      {isExpiringSoon && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM8 13a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                            </svg>
                            <span className="text-red-800 font-medium text-sm">
                              Expired: This appointment is past the 15-minute grace period
                            </span>
                          </div>
                          <p className="text-red-700 text-xs mt-1">
                            This appointment will be automatically declined as it's past the appointment time.
                          </p>
                        </div>
                      )}
                      
                      {/* Conflict Warning */}
                      {hasConflict && (
                        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-yellow-800 font-medium text-sm">
                              Conflict: {conflicts.length + 1} customers booked {appointment.date} at {appointment.time}
                            </span>
                          </div>
                          <p className="text-yellow-700 text-xs mt-1">
                            Approving this will automatically reject the other {conflicts.length} conflicting appointment{conflicts.length > 1 ? 's' : ''}.
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{appointment.customerName}</h3>
                          <p className="text-gray-600">{appointment.customerPhone}</p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-xl p-4">
                        <p className="text-blue-600 font-medium text-sm mb-1">Date & Time</p>
                        <p className="text-gray-900 font-semibold">{formatDisplayDate(new Date(appointment.date))}</p>
                        <p className="text-gray-600">{appointment.time}</p>
                      </div>
                      
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-green-600 font-medium text-sm mb-1">Services</p>
                        <div className="space-y-1">
                          {appointment.services.map((service, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-900">{service.name}</span>
                              <span className="text-gray-600">{service.price} TL</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-xl p-4">
                        <p className="text-purple-600 font-medium text-sm mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-purple-700">{appointment.totalPrice} TL</p>
                        <p className="text-gray-600 text-sm">{appointment.services.length} service{appointment.services.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-gray-100">
                      {appointment.status === 'pending' && (
                        <div className="flex gap-3 mb-3">
                          <button
                            onClick={() => handleStatusUpdate(appointment.id!, 'approved')}
                            className="flex-1 bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(appointment.id!, 'rejected')}
                            className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Reject
                          </button>
                        </div>
                      )}
                      
                      {/* Management Actions for Approved Appointments */}
                      {appointment.status === 'approved' && (
                        <div className="flex gap-2">
                          {!isAppointmentPast(appointment.date, appointment.time) ? (
                            // Future appointments - show Move and Cancel
                            <>
                              <button
                                onClick={() => setAppointmentToMove(appointment)}
                                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" />
                                </svg>
                                Move
                              </button>
                              <button
                                onClick={() => setAppointmentToCancel(appointment)}
                                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7z" clipRule="evenodd" />
                                </svg>
                                Cancel
                              </button>
                            </>
                          ) : (
                            // Past appointments - show smaller No Show option
                            <button
                              onClick={() => setAppointmentToMarkNoShow(appointment)}
                              className="px-3 py-2 bg-orange-100 text-orange-700 border border-orange-300 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors duration-200 flex items-center gap-2"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              No Show
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Cancel Confirmation Modal */}
        <ConfirmModal
          isOpen={!!appointmentToCancel}
          onClose={() => setAppointmentToCancel(null)}
          onConfirm={handleCancelAppointment}
          title="Cancel Appointment"
          message={`Are you sure you want to cancel ${appointmentToCancel?.customerName}'s appointment on ${appointmentToCancel?.date} at ${appointmentToCancel?.time}?`}
          confirmText="Yes, Cancel"
          cancelText="Keep Appointment"
          confirmColor="red"
        />

        {/* Move Appointment Modal */}
        <MoveAppointmentModal
          isOpen={!!appointmentToMove}
          onClose={() => setAppointmentToMove(null)}
          onConfirm={handleMoveAppointment}
          currentDate={appointmentToMove?.date || ''}
          currentTime={appointmentToMove?.time || ''}
          customerName={appointmentToMove?.customerName || ''}
          bookedSlots={bookedSlots}
        />

        {/* No Show Confirmation Modal */}
        <ConfirmModal
          isOpen={!!appointmentToMarkNoShow}
          onClose={() => setAppointmentToMarkNoShow(null)}
          onConfirm={handleMarkNoShow}
          title="Mark as No-Show"
          message={`Mark ${appointmentToMarkNoShow?.customerName}'s appointment as no-show? This will reduce revenue and appointment count for analytics.`}
          confirmText="Mark No-Show"
          cancelText="Keep as Completed"
          confirmColor="red"
        />

        {/* Note: Conflict resolution is now handled automatically when approving appointments */}
      </div>
    </div>
  );
};

export default AdminPanel;