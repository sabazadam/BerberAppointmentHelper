import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { BlockedTimeSlot, AdminBooking } from '../types/admin';

const BLOCKED_SLOTS_COLLECTION = 'blockedSlots';
const APPOINTMENTS_COLLECTION = 'appointments';

export const adminService = {
  // Block time slot
  async blockTimeSlot(date: string, time: string, reason?: string): Promise<string> {
    try {
      const blockedSlot: Omit<BlockedTimeSlot, 'id'> = {
        date,
        time,
        reason: reason || 'Unavailable',
        blockedBy: 'admin',
        createdAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, BLOCKED_SLOTS_COLLECTION), {
        ...blockedSlot,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error blocking time slot:', error);
      throw error;
    }
  },

  // Unblock time slot
  async unblockTimeSlot(date: string, time: string): Promise<void> {
    try {
      const q = query(
        collection(db, BLOCKED_SLOTS_COLLECTION),
        where('date', '==', date),
        where('time', '==', time)
      );
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (docSnapshot) => {
        await deleteDoc(doc(db, BLOCKED_SLOTS_COLLECTION, docSnapshot.id));
      });
    } catch (error) {
      console.error('Error unblocking time slot:', error);
      throw error;
    }
  },

  // Get blocked slots
  async getBlockedSlots(): Promise<{ [key: string]: string[] }> {
    try {
      const querySnapshot = await getDocs(collection(db, BLOCKED_SLOTS_COLLECTION));
      const blockedSlots: { [key: string]: string[] } = {};
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const date = data.date;
        const time = data.time;
        
        if (!blockedSlots[date]) {
          blockedSlots[date] = [];
        }
        blockedSlots[date].push(time);
      });
      
      return blockedSlots;
    } catch (error) {
      console.error('Error getting blocked slots:', error);
      throw error;
    }
  },

  // Create admin booking (for phone customers)
  async createAdminBooking(bookingData: AdminBooking): Promise<string> {
    try {
      const appointmentToSave = {
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
        date: bookingData.date,
        time: bookingData.time,
        services: bookingData.services,
        totalPrice: bookingData.totalPrice,
        status: 'approved', // Admin bookings are auto-approved
        bookedBy: 'admin',
        customerType: bookingData.customerType,
        notes: bookingData.notes || '',
        createdAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(collection(db, APPOINTMENTS_COLLECTION), appointmentToSave);
      return docRef.id;
    } catch (error) {
      console.error('Error creating admin booking:', error);
      throw error;
    }
  },

  // Move appointment to different time
  async moveAppointment(appointmentId: string, newDate: string, newTime: string): Promise<void> {
    try {
      const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
      await updateDoc(appointmentRef, {
        date: newDate,
        time: newTime,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error moving appointment:', error);
      throw error;
    }
  },

  // Cancel appointment
  async cancelAppointment(appointmentId: string): Promise<void> {
    try {
      const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
      await updateDoc(appointmentRef, {
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  },

  // Mark appointment as no-show
  async markNoShow(appointmentId: string): Promise<void> {
    try {
      const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
      await updateDoc(appointmentRef, {
        status: 'no_show',
        noShowAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error marking appointment as no-show:', error);
      throw error;
    }
  },

  // Delete appointment (for conflict resolution)
  async deleteAppointment(appointmentId: string): Promise<void> {
    try {
      const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
      await deleteDoc(appointmentRef);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  },
};