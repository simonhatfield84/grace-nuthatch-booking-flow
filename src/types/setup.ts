
export type SetupStep = 'admin' | 'code-verification' | 'venue' | 'complete';

export interface AdminData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface VenueData {
  venueName: string;
  venueSlug: string;
  venueEmail: string;
  venuePhone: string;
  venueAddress: string;
}

// Add venue setup result interface
export interface VenueSetupResult {
  success: boolean;
  venue?: any;
  error?: string;
}

// Comprehensive error type definitions
export interface SetupError {
  message: string;
  code?: string;
  type: 'auth' | 'validation' | 'api' | 'network' | 'unknown';
}

export interface AuthError extends SetupError {
  type: 'auth';
  code: 'user_already_registered' | 'over_email_send_rate_limit' | 'invalid_credentials' | 'email_not_confirmed';
}

export interface ValidationError extends SetupError {
  type: 'validation';
  field?: string;
}

export interface ApiError extends SetupError {
  type: 'api';
  statusCode?: number;
}

export interface NetworkError extends SetupError {
  type: 'network';
}

// Router location state typing
export interface SetupLocationState {
  from?: {
    pathname: string;
  };
}

// Type guards for error discrimination
export function isAuthError(error: unknown): error is AuthError {
  return typeof error === 'object' && error !== null && 'type' in error && (error as SetupError).type === 'auth';
}

export function isValidationError(error: unknown): error is ValidationError {
  return typeof error === 'object' && error !== null && 'type' in error && (error as SetupError).type === 'validation';
}

export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'type' in error && (error as SetupError).type === 'api';
}

// Error converter function to transform unknown errors into typed errors
export function convertToSetupError(error: unknown): SetupError {
  if (error instanceof Error) {
    // Check for specific Supabase auth error patterns
    if (error.message.includes('User already registered')) {
      return {
        message: error.message,
        code: 'user_already_registered',
        type: 'auth'
      } as AuthError;
    }
    
    if (error.message.includes('over_email_send_rate_limit')) {
      return {
        message: error.message,
        code: 'over_email_send_rate_limit',
        type: 'auth'
      } as AuthError;
    }
    
    return {
      message: error.message,
      type: 'unknown'
    };
  }
  
  if (typeof error === 'string') {
    return {
      message: error,
      type: 'unknown'
    };
  }
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return {
      message: String(error.message),
      type: 'unknown'
    };
  }
  
  return {
    message: 'An unknown error occurred',
    type: 'unknown'
  };
}
