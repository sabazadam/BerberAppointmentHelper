import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Appointment, AppointmentRequest } from '../types';
import { isPendingAppointmentExpired } from '../utils/timeUtils';

const APPOINTMENTS_COLLECTION = 'appointments';

export const appointmentService = {
  // Create new appointment request
  async createAppointment(appointmentData: AppointmentRequest): Promise<string> {
    try {
      console.log('Attempting to create appointment:', appointmentData);
      
      const appointmentToSave = {
        customerName: appointmentData.customerName,
        customerPhone: appointmentData.customerPhone,
        date: appointmentData.date,
        time: appointmentData.time,
        services: appointmentData.services,
        totalPrice: appointmentData.totalPrice,
        status: 'pending',
        createdAt: Timestamp.now(),
      };
      
      console.log('Data to save:', appointmentToSave);
      
      const docRef = await addDoc(collection(db, APPOINTMENTS_COLLECTION), appointmentToSave);
      console.log('Successfully created appointment with ID:', docRef.id);
      
      return docRef.id;
    } catch (error: any) {
      console.error('Detailed error creating appointment:', {
        error,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Provide more specific error messages
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check Firebase security rules.');
      } else if (error.code === 'unavailable') {
        throw new Error('Firebase service is currently unavailable. Please try again later.');
      } else if (error.code === 'unauthenticated') {
        throw new Error('Authentication required. Please check Firebase configuration.');
      } else {
        throw new Error(`Failed to submit appointment: ${error.message || 'Unknown error'}`);
      }
    }
  },

  // Get all appointments
  async getAppointments(): Promise<Appointment[]> {
    try {
      const q = query(
        collection(db, APPOINTMENTS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const appointments: Appointment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Appointment);
      });
      
      return appointments;
    } catch (error) {
      console.error('Error getting appointments:', error);
      throw error;
    }
  },

  // Get appointments for a specific date
  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    try {
      const q = query(
        collection(db, APPOINTMENTS_COLLECTION),
        where('date', '==', date),
        where('status', '==', 'approved')
      );
      const querySnapshot = await getDocs(q);
      const appointments: Appointment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Appointment);
      });
      
      return appointments;
    } catch (error) {
      console.error('Error getting appointments by date:', error);
      throw error;
    }
  },

  // Update appointment status (approve/reject)
  async updateAppointmentStatus(appointmentId: string, status: 'approved' | 'rejected'): Promise<void> {
    try {
      const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
      await updateDoc(appointmentRef, {
        status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  },

  // Listen to appointment changes (real-time)
  subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
    const q = query(
      collection(db, APPOINTMENTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const appointments: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Appointment);
      });
      callback(appointments);
    });
  },

  // Get booked slots for calendar
  async getBookedSlots(): Promise<{ [key: string]: string[] }> {
    try {
      const q = query(
        collection(db, APPOINTMENTS_COLLECTION),
        where('status', '==', 'approved')
      );
      const querySnapshot = await getDocs(q);
      const bookedSlots: { [key: string]: string[] } = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.date;
        const time = data.time;
        
        if (!bookedSlots[date]) {
          bookedSlots[date] = [];
        }
        bookedSlots[date].push(time);
      });
      
      return bookedSlots;
    } catch (error) {
      console.error('Error getting booked slots:', error);
      throw error;
    }
  },

  // Auto-decline expired pending appointments
  async autoDeclineExpiredAppointments(): Promise<void> {
    try {
      const q = query(
        collection(db, APPOINTMENTS_COLLECTION),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);
      
      const expiredAppointments: string[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const appointment = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Appointment;
        
        if (isPendingAppointmentExpired(appointment.date, appointment.time)) {
          expiredAppointments.push(appointment.id!);
        }
      });
      
      // Update all expired appointments to rejected status
      const updatePromises = expiredAppointments.map(appointmentId =>
        updateDoc(doc(db, APPOINTMENTS_COLLECTION, appointmentId), {
          status: 'rejected',
          updatedAt: Timestamp.now(),
        })
      );
      
      await Promise.all(updatePromises);
      
      if (expiredAppointments.length > 0) {
        console.log(`Auto-declined ${expiredAppointments.length} expired pending appointments`);
      }
    } catch (error) {
      console.error('Error auto-declining expired appointments:', error);
    }
  }
};