export interface BlockedTimeSlot {
  id?: string;
  date: string;
  time: string;
  reason?: string;
  blockedBy: 'admin';
  createdAt: Date;
}

export interface AdminBooking extends Omit<import('./index').AppointmentRequest, 'status'> {
  bookedBy: 'admin';
  customerType: 'phone' | 'walkin';
  notes?: string;
}