import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar/Calendar';
import BookingModal from './components/BookingModal/BookingModal';
import AdminPanel from './components/AdminPanel/AdminPanel';
import SuccessModal from './components/ui/SuccessModal';
import { AppointmentRequest, Appointment } from './types';
import { appointmentService } from './services/appointmentService';
import { adminService } from './services/adminService';
import { testFirebaseConnection } from './services/firebaseTest';

type View = 'customer' | 'admin';

function App() {
  const [currentView, setCurrentView] = useState<View>('customer');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string }>({
    date: '',
    time: ''
  });
  const [bookedSlots, setBookedSlots] = useState<{ [key: string]: string[] }>({});
  const [blockedSlots, setBlockedSlots] = useState<{ [key: string]: string[] }>({});
  const [, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load booked and blocked slots from Firebase
  useEffect(() => {
    const loadSlots = async () => {
      try {
        // Auto-decline expired appointments on app load
        await appointmentService.autoDeclineExpiredAppointments();
        
        const [bookedSlotsData, blockedSlotsData] = await Promise.all([
          appointmentService.getBookedSlots(),
          adminService.getBlockedSlots()
        ]);
        setBookedSlots(bookedSlotsData);
        setBlockedSlots(blockedSlotsData);
      } catch (error) {
        console.error('Error loading slots:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSlots();

    // Set up real-time listener for appointments
    const unsubscribe = appointmentService.subscribeToAppointments((updatedAppointments) => {
      setAppointments(updatedAppointments);
      
      // Update booked slots based on approved appointments
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
    });

    return () => unsubscribe();
  }, []);

  const handleTimeSlotClick = (date: string, time: string) => {
    setSelectedSlot({ date, time });
    setIsModalOpen(true);
  };

  const handleAppointmentSubmit = async (appointment: AppointmentRequest) => {
    try {
      console.log('Submitting appointment:', appointment);
      
      // Format phone number for saving (keep only digits, but we can format for display)
      const formattedAppointment = {
        ...appointment,
        customerPhone: appointment.customerPhone.replace(/\D/g, '') // Save only digits
      };
      
      const appointmentId = await appointmentService.createAppointment(formattedAppointment);
      console.log('Appointment created with ID:', appointmentId);
      
      setIsModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      
      // Show specific error message
      const errorMessage = error.message || 'Failed to submit appointment. Please try again.';
      alert(errorMessage);
    }
  };

  const handleFirebaseTest = async () => {
    const result = await testFirebaseConnection();
    if (result.success) {
      alert('✅ Firebase connection successful!');
    } else {
      alert(`❌ Firebase connection failed: ${result.message}`);
    }
  };

  if (loading && currentView === 'customer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-lg"></div>
          <p className="text-slate-700 font-semibold text-lg">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Navigation */}
      <div className="fixed top-6 right-6 z-50">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-3">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('customer')}
              className={`px-5 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                currentView === 'customer'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-600 hover:bg-white/70 hover:shadow-md'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className={`px-5 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                currentView === 'admin'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-600 hover:bg-white/70 hover:shadow-md'
              }`}
            >
              Admin
            </button>
            <button
              onClick={handleFirebaseTest}
              className="px-4 py-3 rounded-xl font-semibold text-slate-600 hover:bg-white/70 hover:shadow-md transition-all duration-300 transform hover:scale-105 text-sm"
              title="Test Firebase Connection"
            >
              🔧 Test
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {currentView === 'customer' ? (
        <>
          <Calendar 
            onTimeSlotClick={handleTimeSlotClick}
            bookedSlots={bookedSlots}
            blockedSlots={blockedSlots}
          />
          
          <BookingModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            selectedDate={selectedSlot.date}
            selectedTime={selectedSlot.time}
            onSubmit={handleAppointmentSubmit}
          />
          
          <SuccessModal
            isOpen={isSuccessModalOpen}
            onClose={() => setIsSuccessModalOpen(false)}
            title="Appointment Submitted!"
            message="Your appointment request has been submitted successfully! Please wait for admin approval."
          />
        </>
      ) : (
        <AdminPanel />
      )}
    </>
  );
}

export default App;
