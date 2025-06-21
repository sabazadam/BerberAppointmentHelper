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
      <div className="min-h-screen bg-gradient-to-br from-barber-cream via-white to-barber-cream/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-barber-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-barber-dark font-medium">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Navigation */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('customer')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                currentView === 'customer'
                  ? 'bg-barber-gold text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                currentView === 'admin'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Admin
            </button>
            <button
              onClick={handleFirebaseTest}
              className="px-3 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200 text-sm"
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
