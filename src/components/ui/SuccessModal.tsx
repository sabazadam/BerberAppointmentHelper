import React from 'react';
import { Dialog } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = "Success!",
  message = "Your request has been submitted successfully."
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
            
            {/* Success Content */}
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
                <CheckCircleIcon className="h-12 w-12 text-green-600" />
              </div>
              
              {/* Title */}
              <Dialog.Title className="text-2xl font-bold text-gray-900 mb-3">
                {title}
              </Dialog.Title>
              
              {/* Message */}
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                {message}
              </p>
              
              {/* Action Button */}
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Great! Continue Browsing
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default SuccessModal;