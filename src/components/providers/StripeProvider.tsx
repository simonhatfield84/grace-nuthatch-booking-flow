import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ReactNode } from 'react';

// Initialize Stripe with The Nuthatch's publishable key
const stripePromise = loadStripe('pk_test_51QP5ZGGKo5PoX7bk6DYPHnmqWCMVkwj7qvLjKEFXbUvvCLg7bNIXKJQ0iQmJHiQ7HHZ9HKyMKNc4c5FVJjLbKoB400DGk4uSTD');

interface StripeProviderProps {
  children: ReactNode;
}

export const StripeProvider = ({ children }: StripeProviderProps) => {
  const options = {
    // Appearance customization to match The Nuthatch brand
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#8B4513', // The Nuthatch brown
        colorBackground: '#ffffff',
        colorText: '#1a1a1a',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
        spacingUnit: '4px',
      },
      rules: {
        '.Input': {
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '16px',
          transition: 'border-color 0.2s ease',
        },
        '.Input:focus': {
          borderColor: '#8B4513',
          boxShadow: '0 0 0 3px rgba(139, 69, 19, 0.1)',
        },
        '.Label': {
          color: '#374151',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '8px',
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};