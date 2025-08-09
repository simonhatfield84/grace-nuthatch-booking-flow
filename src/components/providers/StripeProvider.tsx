
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ReactNode, useMemo } from 'react';
import { useStripePublishableKey } from '@/hooks/useStripePublishableKey';
import { usePublicStripeSettings } from '@/hooks/usePublicStripeSettings';
import { useAuth } from '@/contexts/AuthContext';

interface StripeProviderProps {
  children: ReactNode;
  venueId?: string;
  venueSlug?: string;
  usePublicMode?: boolean;
}

export const StripeProvider = ({ children, venueId, venueSlug, usePublicMode = false }: StripeProviderProps) => {
  // Safely check if we're in an auth context
  let hasAuth = true;
  let authUser = null;
  
  try {
    authUser = useAuth();
    hasAuth = true;
  } catch (error) {
    console.log('🔍 No auth context available, using public mode');
    hasAuth = false;
  }
  
  const shouldUsePublicMode = usePublicMode || !hasAuth;
  
  console.log('🔧 StripeProvider config:', {
    hasAuth,
    shouldUsePublicMode,
    venueId,
    venueSlug,
    usePublicMode
  });
  
  // Use public hook for unauthenticated users, authenticated hook for admin users
  const authenticatedStripe = hasAuth ? useStripePublishableKey() : { 
    publishableKey: null, 
    isTestMode: true, 
    isActive: false, 
    isLoading: false 
  };
  
  const publicStripe = usePublicStripeSettings({ venueId, venueSlug });
  
  const { publishableKey, isTestMode, isActive, isLoading } = shouldUsePublicMode ? publicStripe : authenticatedStripe;

  console.log('💳 Stripe settings result:', {
    publishableKey: publishableKey ? '***configured***' : 'null',
    isTestMode,
    isActive,
    isLoading,
    mode: shouldUsePublicMode ? 'public' : 'authenticated'
  });

  const stripePromise = useMemo(() => {
    if (!publishableKey) {
      console.log('❌ No publishable key available');
      return null;
    }
    console.log('✅ Loading Stripe with key');
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

  // Show loading state
  if (isLoading) {
    console.log('⏳ Stripe provider is loading...');
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-muted-foreground">Loading payment system...</div>
      </div>
    );
  }

  // Show error state if Stripe is not configured
  if (!isActive || !stripePromise) {
    console.log('❌ Stripe not configured:', { isActive, hasStripePromise: !!stripePromise });
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
        <strong>Payment system unavailable:</strong> Stripe is not configured for this venue.
        <div className="mt-2 text-xs opacity-75">
          Debug: isActive={String(isActive)}, hasStripePromise={String(!!stripePromise)}, mode={shouldUsePublicMode ? 'public' : 'authenticated'}
        </div>
      </div>
    );
  }

  console.log('✅ Stripe provider ready');
  
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
