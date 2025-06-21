import React from 'react';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Appointment } from '../../types';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictingAppointments: Appointment[];
  onResolveConflict: (keepAppointmentId: string, deleteAppointmentIds: string[]) => void;
}

const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onClose,
  conflictingAppointments,
  onResolveConflict
}) => {
  const [selectedAppointment, setSelectedAppointment] = React.useState<string>('');

  const handleResolve = () => {
    if (selectedAppointment) {
      const deleteIds = conflictingAppointments
        .filter(apt => apt.id !== selectedAppointment)
        .map(apt => apt.id!);
      
      onResolveConflict(selectedAppointment, deleteIds);
      setSelectedAppointment('');
    }
  };

  if (conflictingAppointments.length === 0) return null;

  const timeSlot = `${conflictingAppointments[0].date} at ${conflictingAppointments[0].time}`;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
            
            <div className="p-8">
              {/* Warning Icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 mb-6">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              </div>
              
              {/* Title */}
              <Dialog.Title className="text-2xl font-bold text-gray-900 text-center mb-4">
                Time Slot Conflict Detected
              </Dialog.Title>
              
              {/* Message */}
              <p className="text-gray-600 text-center leading-relaxed mb-8">
                Multiple customers have booked the same time slot: <strong>{timeSlot}</strong>
                <br />
                Please select which appointment to keep and the others will be automatically cancelled.
              </p>
              
              {/* Conflicting Appointments */}
              <div className="space-y-3 mb-8">
                {conflictingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedAppointment === appointment.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedAppointment(appointment.id!)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAppointment === appointment.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedAppointment === appointment.id && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{appointment.customerName}</h4>
                            <p className="text-gray-600 text-sm">{appointment.customerPhone}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-600">{appointment.totalPrice} TL</p>
                            <p className="text-gray-500 text-sm">
                              {appointment.services.length} service{appointment.services.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-gray-600 text-sm">
                            Services: {appointment.services.map(s => s.name).join(', ')}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Booked: {appointment.createdAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  disabled={!selectedAppointment}
                  className={`flex-1 px-6 py-3 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] ${
                    selectedAppointment
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Resolve Conflict
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default ConflictModal;