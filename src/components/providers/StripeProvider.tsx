
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ReactNode, useMemo } from 'react';
import { useStripePublishableKey } from '@/hooks/useStripePublishableKey';

interface StripeProviderProps {
  children: ReactNode;
}

export const StripeProvider = ({ children }: StripeProviderProps) => {
  const { publishableKey, isTestMode } = useStripePublishableKey();

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, [publishableKey]);

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

  if (!stripePromise) {
    return <div>{children}</div>;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {isTestMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-4 text-sm text-yellow-800">
          <strong>Test Mode:</strong> No real payments will be processed. Use test card 4242 4242 4242 4242.
        </div>
      )}
      {children}
    </Elements>
  );
};
