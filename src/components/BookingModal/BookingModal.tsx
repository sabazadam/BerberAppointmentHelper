import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Service, AppointmentRequest } from '../../types';
import { SERVICES } from '../../utils/constants';
import PhoneInput from '../ui/PhoneInput';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedTime: string;
  onSubmit: (appointment: AppointmentRequest) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
  });
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const toggleService = (service: Service) => {
    setSelectedServices(prev => 
      prev.find(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    );
  };

  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Name is required';
    }
    
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    } else if (formData.customerPhone.replace(/\D/g, '').length !== 10) {
      newErrors.customerPhone = 'Please enter a valid 10-digit phone number';
    }
    
    if (selectedServices.length === 0) {
      newErrors.services = 'Please select at least one service';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const appointment: AppointmentRequest = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        date: selectedDate,
        time: selectedTime,
        services: selectedServices,
        totalPrice,
      };
      onSubmit(appointment);
      onClose();
      // Reset form
      setFormData({ customerName: '', customerPhone: '' });
      setSelectedServices([]);
      setErrors({});
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-barber-gold to-yellow-500 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-2xl font-bold">
                  Book Appointment
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <p className="text-white/90 mt-2">Fill in your details to complete your booking</p>
            </div>

            <div className="p-8">
              {/* Selected Date & Time */}
              <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Your Appointment</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedDate} at {selectedTime}
                    </p>
                  </div>
                </div>
              </div>

            <form onSubmit={handleSubmit}>
              {/* Customer Info */}
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 text-gray-900 ${
                        errors.customerName 
                          ? 'border-red-400 focus:border-red-500 bg-red-50' 
                          : 'border-gray-200 focus:border-barber-gold bg-gray-50 focus:bg-white'
                      }`}
                      placeholder="Enter your full name"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  {errors.customerName && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.customerName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Phone Number * (10 digits)
                  </label>
                  <PhoneInput
                    value={formData.customerPhone}
                    onChange={(value) => setFormData(prev => ({ ...prev, customerPhone: value }))}
                    error={errors.customerPhone}
                    placeholder="123-456-7890"
                  />
                  {errors.customerPhone && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.customerPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Services */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-800 mb-4">
                  Select Services *
                </label>
                <div className="space-y-3">
                  {SERVICES.map((service) => {
                    const isSelected = selectedServices.find(s => s.id === service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service)}
                        className={`group relative flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                          isSelected
                            ? 'border-barber-gold bg-gradient-to-r from-barber-gold/10 to-yellow-500/10 shadow-md'
                            : 'border-gray-200 hover:border-barber-gold/50 bg-white hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'border-barber-gold bg-barber-gold' 
                              : 'border-gray-300 group-hover:border-barber-gold'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{service.name}</p>
                            <p className="text-sm text-gray-600">{service.duration} minutes</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${isSelected ? 'text-barber-gold' : 'text-gray-700'}`}>
                            {service.price} TL
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errors.services && (
                  <p className="text-red-500 text-sm mt-3 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.services}
                  </p>
                )}
              </div>

              {/* Total */}
              {selectedServices.length > 0 && (
                <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-green-700 font-medium">Total Amount</p>
                      <p className="text-xs text-green-600 mt-1">
                        {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-700">{totalPrice} TL</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-barber-gold to-yellow-500 text-white rounded-xl hover:from-barber-gold/90 hover:to-yellow-500/90 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Book Appointment
                </button>
              </div>
            </form>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default BookingModal;