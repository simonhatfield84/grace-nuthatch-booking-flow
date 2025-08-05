
import React, { createContext, useContext, useState } from 'react';
import { BookingFormData } from '../types/booking';

interface BookingFormContextType {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  resetForm: () => void;
}

const BookingFormContext = createContext<BookingFormContextType | undefined>(undefined);

export const useBookingForm = () => {
  const context = useContext(BookingFormContext);
  if (!context) {
    throw new Error('useBookingForm must be used within a BookingFormProvider');
  }
  return context;
};

interface BookingFormProviderProps {
  children: React.ReactNode;
  venueId: string;
}

export const BookingFormProvider: React.FC<BookingFormProviderProps> = ({ children, venueId }) => {
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    partySize: 2,
  });

  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const resetForm = () => {
    setFormData({ partySize: 2 });
  };

  return (
    <BookingFormContext.Provider value={{ formData, updateFormData, resetForm }}>
      {children}
    </BookingFormContext.Provider>
  );
};
