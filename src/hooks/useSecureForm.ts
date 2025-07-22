
import { useState, useCallback } from 'react';
import { InputSanitizer, RateLimiter, SecurityValidator } from '@/utils/inputSanitization';
import { toast } from 'sonner';

interface SecureFormOptions {
  enableRateLimit?: boolean;
  rateLimitRequests?: number;
  rateLimitWindow?: number;
  enableSuspiciousContentCheck?: boolean;
}

export const useSecureForm = (options: SecureFormOptions = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);

  const {
    enableRateLimit = true,
    rateLimitRequests = 10,
    rateLimitWindow = 60000, // 1 minute
    enableSuspiciousContentCheck = true
  } = options;

  const validateAndSanitizeInput = useCallback((
    input: string,
    type: 'text' | 'email' | 'phone' | 'name' | 'richText' | 'notes' | 'search' = 'text'
  ) => {
    // Check for suspicious content first
    if (enableSuspiciousContentCheck) {
      const suspiciousCheck = SecurityValidator.detectSuspiciousContent(input);
      if (suspiciousCheck.suspicious) {
        console.warn('Suspicious content detected:', suspiciousCheck.reason);
        toast.error('Invalid input detected. Please check your content.');
        return null;
      }
    }

    // Sanitize based on type
    switch (type) {
      case 'email':
        if (!SecurityValidator.isValidEmail(input)) {
          toast.error('Please enter a valid email address');
          return null;
        }
        return InputSanitizer.sanitizeEmail(input);
      
      case 'phone':
        if (!SecurityValidator.isValidPhone(input)) {
          toast.error('Please enter a valid phone number');
          return null;
        }
        return InputSanitizer.sanitizePhone(input);
      
      case 'name':
        return InputSanitizer.sanitizeName(input);
      
      case 'richText':
        return InputSanitizer.sanitizeRichText(input);
      
      case 'notes':
        return InputSanitizer.sanitizeNotes(input);
      
      case 'search':
        return InputSanitizer.sanitizeSearchQuery(input);
      
      default:
        return InputSanitizer.sanitizeText(input);
    }
  }, [enableSuspiciousContentCheck]);

  const checkRateLimit = useCallback(() => {
    if (!enableRateLimit) return true;

    const identifier = RateLimiter.getClientIdentifier(
      navigator.userAgent,
      'client' // We can't get real IP on client side
    );

    const { allowed } = RateLimiter.checkLimit(
      identifier,
      rateLimitRequests,
      rateLimitWindow
    );

    if (!allowed) {
      setRateLimitExceeded(true);
      toast.error('Too many requests. Please wait before trying again.');
      return false;
    }

    setRateLimitExceeded(false);
    return true;
  }, [enableRateLimit, rateLimitRequests, rateLimitWindow]);

  const secureSubmit = useCallback(async (
    submitFn: () => Promise<void>,
    formData?: Record<string, any>
  ) => {
    // Check rate limit
    if (!checkRateLimit()) return;

    // Validate form data if provided
    if (formData && enableSuspiciousContentCheck) {
      for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'string') {
          const suspiciousCheck = SecurityValidator.detectSuspiciousContent(value);
          if (suspiciousCheck.suspicious) {
            console.warn(`Suspicious content in field ${key}:`, suspiciousCheck.reason);
            toast.error('Invalid input detected. Please check your form data.');
            return;
          }
        }
      }
    }

    setIsSubmitting(true);
    try {
      await submitFn();
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [checkRateLimit, enableSuspiciousContentCheck]);

  return {
    validateAndSanitizeInput,
    secureSubmit,
    isSubmitting,
    rateLimitExceeded
  };
};
