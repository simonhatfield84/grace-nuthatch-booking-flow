
import { AdminData } from '@/types/setup';
import { PASSWORD_MIN_LENGTH } from '@/utils/setupConstants';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateAdminForm = (adminData: AdminData): ValidationError[] => {
  console.log('🔍 Validating admin form data:', adminData);
  const errors: ValidationError[] = [];

  if (!adminData.firstName.trim()) {
    console.log('❌ First name validation failed');
    errors.push({ field: 'firstName', message: 'First name is required' });
  }

  if (!adminData.lastName.trim()) {
    console.log('❌ Last name validation failed');
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }

  if (!adminData.email.trim()) {
    console.log('❌ Email validation failed - empty');
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminData.email)) {
    console.log('❌ Email validation failed - invalid format');
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  if (adminData.password.length < PASSWORD_MIN_LENGTH) {
    console.log('❌ Password validation failed - too short');
    errors.push({ 
      field: 'password', 
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` 
    });
  }

  if (adminData.password !== adminData.confirmPassword) {
    console.log('❌ Password confirmation validation failed');
    errors.push({ 
      field: 'confirmPassword', 
      message: 'Passwords do not match. Please check and try again.' 
    });
  }

  console.log('📋 Validation results:', errors);
  return errors;
};

export const getFirstValidationError = (adminData: AdminData): string | null => {
  const errors = validateAdminForm(adminData);
  const firstError = errors.length > 0 ? errors[0].message : null;
  console.log('🎯 First validation error:', firstError);
  return firstError;
};
