export interface GuestFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
  marketingOptIn: boolean;
  termsAccepted: boolean;
}

export function validateGuestForm(data: GuestFormData): string | null {
  if (!data.name.trim()) {
    return 'Please enter your name';
  }
  
  if (data.name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  
  if (!data.email.trim()) {
    return 'Please enter your email';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return 'Please enter a valid email address';
  }
  
  if (!data.phone.trim()) {
    return 'Please enter your phone number';
  }
  
  if (data.phone.trim().length < 10) {
    return 'Please enter a valid phone number';
  }
  
  if (!data.termsAccepted) {
    return 'You must accept the terms and conditions';
  }
  
  return null;
}
