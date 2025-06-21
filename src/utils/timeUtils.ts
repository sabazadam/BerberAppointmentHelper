export const isTimeSlotPassed = (date: string, time: string): boolean => {
  const now = new Date();
  const slotDate = new Date(date);
  
  // If it's not today, compare dates
  if (slotDate.toDateString() !== now.toDateString()) {
    return slotDate < now;
  }
  
  // If it's today, compare times
  const [hours, minutes] = time.split(':').map(Number);
  const slotTime = new Date();
  slotTime.setHours(hours, minutes, 0, 0);
  
  return slotTime < now;
};

export const getCurrentMonthStats = (appointments: any[]) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Only count completed appointments (approved and attended)
  const monthlyAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate.getMonth() === currentMonth && 
           aptDate.getFullYear() === currentYear &&
           apt.status === 'approved' &&
           apt.status !== 'no_show'; // Exclude no-shows from revenue/count
  });
  
  const totalRevenue = monthlyAppointments.reduce((sum, apt) => sum + apt.totalPrice, 0);
  const totalAppointments = monthlyAppointments.length;
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return {
    monthName: monthNames[currentMonth],
    year: currentYear,
    totalRevenue,
    totalAppointments,
    appointments: monthlyAppointments,
    noShows: appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.getMonth() === currentMonth && 
             aptDate.getFullYear() === currentYear &&
             apt.status === 'no_show';
    }).length
  };
};

export const isAppointmentPast = (date: string, time: string): boolean => {
  const now = new Date();
  const appointmentDate = new Date(date);
  
  // If it's not today, compare dates
  if (appointmentDate.toDateString() !== now.toDateString()) {
    return appointmentDate < now;
  }
  
  // If it's today, compare times with a 30-minute buffer
  const [hours, minutes] = time.split(':').map(Number);
  const appointmentTime = new Date();
  appointmentTime.setHours(hours, minutes + 30, 0, 0); // Add 30 min buffer
  
  return appointmentTime < now;
};

export const isPendingAppointmentExpired = (date: string, time: string): boolean => {
  const now = new Date();
  const appointmentDate = new Date(date);
  
  // If it's not today, compare dates
  if (appointmentDate.toDateString() !== now.toDateString()) {
    return appointmentDate < now;
  }
  
  // If it's today, check if current time is 15 minutes past appointment time
  const [hours, minutes] = time.split(':').map(Number);
  const appointmentTime = new Date();
  appointmentTime.setHours(hours, minutes + 15, 0, 0); // Add 15 min buffer
  
  return appointmentTime < now;
};