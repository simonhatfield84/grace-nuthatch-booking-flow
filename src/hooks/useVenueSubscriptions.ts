
import { useQuery } from "@tanstack/react-query";

// Placeholder hooks for subscription functionality
// These will be properly implemented when payment system is rebuilt

export const useVenueSubscriptions = () => {
  return useQuery({
    queryKey: ['venue-subscriptions'],
    queryFn: async () => {
      // Return empty array for now
      return [];
    },
  });
};

export const usePaymentTransactions = () => {
  return useQuery({
    queryKey: ['payment-transactions'],
    queryFn: async () => {
      // Return empty array for now
      return [];
    },
  });
};

export const useBillingEvents = () => {
  return useQuery({
    queryKey: ['billing-events'],
    queryFn: async () => {
      // Return empty array for now
      return [];
    },
  });
};

export const useCreateVenueSubscription = () => {
  return {
    mutateAsync: async () => {
      console.log('Subscription creation disabled - payment system removed');
    }
  };
};
