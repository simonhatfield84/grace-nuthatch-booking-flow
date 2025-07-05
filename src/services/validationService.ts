
import { AdminData } from '@/types/setup';
import { PASSWORD_MIN_LENGTH } from '@/utils/setupConstants';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateAdminForm = (adminData: AdminData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!adminData.firstName.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }

  if (!adminData.lastName.trim()) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }

  if (!adminData.email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  }

  if (adminData.password.length < PASSWORD_MIN_LENGTH) {
    errors.push({ 
      field: 'password', 
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` 
    });
  }

  if (adminData.password !== adminData.confirmPassword) {
    errors.push({ 
      field: 'confirmPassword', 
      message: 'Passwords do not match. Please check and try again.' 
    });
  }

  return errors;
};

export const getFirstValidationError = (adminData: AdminData): string | null => {
  const errors = validateAdminForm(adminData);
  return errors.length > 0 ? errors[0].message : null;
};
