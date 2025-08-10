// 🚨 DEPRECATED: This context is not used by the canonical NuthatchBookingWidget
// The NuthatchBookingWidget manages its own state internally
// This file will be removed in a future cleanup

console.warn('⚠️ DEPRECATED: BookingContext is not used by NuthatchBookingWidget and will be removed.');

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { BookingData, BookingStep } from '../types/booking';

interface BookingState {
  currentStepIndex: number;
  bookingData: BookingData;
  isLoading: boolean;
  error: string | null;
  venueId: string | null;
}

type BookingAction =
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'UPDATE_BOOKING_DATA'; payload: Partial<BookingData> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_VENUE_ID'; payload: string }
  | { type: 'RESET_BOOKING' };

const initialState: BookingState = {
  currentStepIndex: 0,
  bookingData: {
    partySize: 2,
    date: null,
    time: '',
    service: null,
    guestDetails: null,
    paymentRequired: false,
    paymentAmount: 0,
    bookingId: null,
  },
  isLoading: false,
  error: null,
  venueId: null,
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_CURRENT_STEP':
      return { ...state, currentStepIndex: action.payload };
    case 'UPDATE_BOOKING_DATA':
      return {
        ...state,
        bookingData: { ...state.bookingData, ...action.payload },
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_VENUE_ID':
      return { ...state, venueId: action.payload };
    case 'RESET_BOOKING':
      return initialState;
    default:
      return state;
  }
}

interface BookingContextValue {
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  goToStep: (stepIndex: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateBookingData: (data: Partial<BookingData>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const goToStep = (stepIndex: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: stepIndex });
  };

  const nextStep = () => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStepIndex + 1 });
  };

  const prevStep = () => {
    if (state.currentStepIndex > 0) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStepIndex - 1 });
    }
  };

  const updateBookingData = (data: Partial<BookingData>) => {
    dispatch({ type: 'UPDATE_BOOKING_DATA', payload: data });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const resetBooking = () => {
    dispatch({ type: 'RESET_BOOKING' });
  };

  const value: BookingContextValue = {
    state,
    dispatch,
    goToStep,
    nextStep,
    prevStep,
    updateBookingData,
    setLoading,
    setError,
    resetBooking,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookingContext() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookingContext must be used within a BookingProvider');
  }
  return context;
}
