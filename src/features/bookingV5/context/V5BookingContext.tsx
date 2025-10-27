import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UTMParams } from '../hooks/useUTM';

export type V5BookingStep = 'partyDate' | 'service' | 'time' | 'guest' | 'payment' | 'confirmation';

export interface V5BookingState {
  // Flow variant
  variant: 'standard' | 'serviceFirst';
  
  // Step management
  currentStep: V5BookingStep;
  completedSteps: Set<V5BookingStep>;
  
  // Booking data
  partySize?: number;
  selectedDate?: Date;
  selectedService?: any;
  selectedTime?: string;
  
  // Lock management
  lockToken?: string;
  lockExpiresAt?: string;
  
  // Guest data
  guestData?: {
    name: string;
    email: string;
    phone: string;
    notes: string;
    marketingOptIn: boolean;
  };
  
  // Payment
  bookingId?: number;
  paymentRequired?: boolean;
  paymentAmount?: number;
  
  // UTM
  utm: UTMParams;
}

interface V5BookingContextType {
  state: V5BookingState;
  updateState: (updates: Partial<V5BookingState>) => void;
  goToStep: (step: V5BookingStep) => void;
  markStepComplete: (step: V5BookingStep) => void;
  resetBooking: () => void;
}

const V5BookingContext = createContext<V5BookingContextType | undefined>(undefined);

export function V5BookingProvider({ 
  children, 
  initialUTM,
  variant = 'standard'
}: { 
  children: ReactNode; 
  initialUTM: UTMParams;
  variant?: 'standard' | 'serviceFirst';
}) {
  const [state, setState] = useState<V5BookingState>({
    variant,
    currentStep: variant === 'serviceFirst' ? 'service' : 'partyDate',
    completedSteps: new Set(),
    utm: initialUTM
  });
  
  console.log('🎯 Initial Booking State:', {
    variant,
    currentStep: variant === 'serviceFirst' ? 'service' : 'partyDate'
  });
  
  const updateState = (updates: Partial<V5BookingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };
  
  const goToStep = (step: V5BookingStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };
  
  const markStepComplete = (step: V5BookingStep) => {
    setState(prev => ({
      ...prev,
      completedSteps: new Set([...prev.completedSteps, step])
    }));
  };
  
  const resetBooking = () => {
    setState({
      variant: state.variant,
      currentStep: state.variant === 'serviceFirst' ? 'service' : 'partyDate',
      completedSteps: new Set(),
      utm: state.utm // Preserve UTM
    });
  };
  
  return (
    <V5BookingContext.Provider value={{ state, updateState, goToStep, markStepComplete, resetBooking }}>
      {children}
    </V5BookingContext.Provider>
  );
}

export function useV5Booking() {
  const context = useContext(V5BookingContext);
  if (!context) {
    throw new Error('useV5Booking must be used within V5BookingProvider');
  }
  return context;
}
