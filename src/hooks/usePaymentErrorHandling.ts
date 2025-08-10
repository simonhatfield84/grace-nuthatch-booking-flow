
import { useState } from 'react';
import { toast } from 'sonner';

interface PaymentError {
  message: string;
  isRetryable: boolean;
  userMessage: string;
}

export const usePaymentErrorHandling = (maxRetries: number = 2) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const parsePaymentError = (error: any): PaymentError => {
    const message = error.message || error.toString() || 'Unknown error';
    
    // Determine if error is retryable
    const isRetryable = 
      message.includes('network') || 
      message.includes('timeout') ||
      message.includes('temporarily unavailable') ||
      message.includes('503') ||
      message.includes('502');

    // Create user-friendly message
    let userMessage = message;
    if (message.includes('not configured')) {
      userMessage = 'Payment system is not configured for this venue. Please contact support.';
    } else if (message.includes('not enabled') || message.includes('not active')) {
      userMessage = 'Payments are currently disabled for this venue. Please contact them directly.';
    } else if (message.includes('decrypt') || message.includes('encryption')) {
      userMessage = 'Payment configuration error. Please contact the venue.';
    } else if (message.includes('Invalid Stripe key') || message.includes('expired')) {
      userMessage = 'Payment system configuration error. Please contact support.';
    } else if (message.includes('not found')) {
      userMessage = 'Venue payment settings not found. Please contact support.';
    } else if (isRetryable) {
      userMessage = 'Connection issue. Please try again.';
    } else {
      userMessage = 'Payment initialization failed. Please try again or contact support.';
    }

    return { message, isRetryable, userMessage };
  };

  const handlePaymentError = async (
    error: any, 
    retryFunction: () => Promise<void>
  ): Promise<boolean> => {
    const parsedError = parsePaymentError(error);
    
    console.error('Payment error:', parsedError.message);

    // Try to retry if the error is retryable and we haven't exceeded max retries
    if (parsedError.isRetryable && retryCount < maxRetries) {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
      
      try {
        // Exponential backoff: wait longer between retries
        const delay = 1000 * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        await retryFunction();
        
        // If retry succeeds, reset counters
        setRetryCount(0);
        setIsRetrying(false);
        return true;
      } catch (retryError) {
        setIsRetrying(false);
        // If retry fails, handle it recursively (but this will hit max retries)
        return await handlePaymentError(retryError, retryFunction);
      }
    }

    // Show error to user
    toast.error(parsedError.userMessage);
    setIsRetrying(false);
    return false;
  };

  const resetRetryCount = () => {
    setRetryCount(0);
    setIsRetrying(false);
  };

  return {
    handlePaymentError,
    resetRetryCount,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries
  };
};
