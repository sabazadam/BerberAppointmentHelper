import React, { useState } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  error,
  placeholder = "Enter your phone number",
  className = ""
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  const formatPhoneNumber = (input: string): string => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedDigits = digits.slice(0, 10);
    
    // Format with dashes
    if (limitedDigits.length >= 6) {
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
    } else if (limitedDigits.length >= 3) {
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`;
    } else {
      return limitedDigits;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue);
    
    setDisplayValue(formatted);
    
    // Return only digits to parent component for validation
    const digitsOnly = inputValue.replace(/\D/g, '');
    onChange(digitsOnly);
  };

  // Update display value when prop changes
  React.useEffect(() => {
    if (value !== displayValue.replace(/\D/g, '')) {
      setDisplayValue(formatPhoneNumber(value));
    }
  }, [value, displayValue]);

  return (
    <div className="relative">
      <input
        type="tel"
        value={displayValue}
        onChange={handleInputChange}
        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 text-gray-900 ${
          error 
            ? 'border-red-400 focus:border-red-500 bg-red-50' 
            : 'border-gray-200 focus:border-barber-gold bg-gray-50 focus:bg-white'
        } ${className}`}
        placeholder={placeholder}
        maxLength={12} // 10 digits + 2 dashes
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
      </div>
    </div>
  );
};

export default PhoneInput;