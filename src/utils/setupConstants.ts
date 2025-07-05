
import { AdminData, VenueData } from '@/types/setup';

export const INITIAL_ADMIN_DATA: AdminData = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: ''
};

export const INITIAL_VENUE_DATA: VenueData = {
  venueName: '',
  venueSlug: '',
  venueEmail: '',
  venuePhone: '',
  venueAddress: ''
};

export const SETUP_STEPS = ['admin', 'code-verification', 'venue'] as const;

export const PASSWORD_MIN_LENGTH = 6;
export const VERIFICATION_CODE_LENGTH = 6;
