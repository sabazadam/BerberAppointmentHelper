export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Appointment {
  id?: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  services: Service[];
  totalPrice: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'no_show';
  createdAt: Date;
  updatedAt?: Date;
  cancelledAt?: Date;
  noShowAt?: Date;
}

export interface AppointmentRequest {
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  services: Service[];
  totalPrice: number;
}