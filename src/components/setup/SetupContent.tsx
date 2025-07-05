
import React from 'react';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AdminAccountForm } from './AdminAccountForm';
import { CodeVerificationStep } from './CodeVerificationStep';
import { VenueSetupForm } from './VenueSetupForm';
import { SetupStep, AdminData, VenueData } from '@/types/setup';

interface SetupContentProps {
  step: SetupStep;
  adminData: AdminData;
  venueData: VenueData;
  loading: boolean;
  verifyLoading: boolean;
  resendLoading: boolean;
  error: string | null;
  onAdminDataChange: (field: keyof AdminData, value: string) => void;
  onVenueDataChange: (field: keyof VenueData, value: string) => void;
  onAdminSubmit: (e: React.FormEvent) => void;
  onVenueSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onVerifyCode: (code: string) => Promise<boolean>;
  onResendCode: () => Promise<void>;
}

export const SetupContent: React.FC<SetupContentProps> = ({
  step,
  adminData,
  venueData,
  loading,
  verifyLoading,
  resendLoading,
  error,
  onAdminDataChange,
  onVenueDataChange,
  onAdminSubmit,
  onVenueSubmit,
  onBack,
  onVerifyCode,
  onResendCode
}) => {
  const getStepContent = () => {
    switch (step) {
      case 'admin':
        return {
          title: "Create Admin Account",
          description: "First, let's create your administrator account that will manage the venue.",
          content: (
            <AdminAccountForm
              adminData={adminData}
              onInputChange={onAdminDataChange}
              onSubmit={onAdminSubmit}
              loading={loading}
            />
          )
        };

      case 'code-verification':
        return {
          title: "Verify Your Email",
          description: "We've sent a 6-digit verification code to your email address.",
          content: (
            <CodeVerificationStep
              email={adminData.email}
              onBack={onBack}
              onVerify={onVerifyCode}
              onResendCode={onResendCode}
              verifyLoading={verifyLoading}
              resendLoading={resendLoading}
              error={error}
            />
          )
        };

      case 'venue':
        return {
          title: "Setup Your Venue",
          description: "Now let's configure your venue information for guests and bookings.",
          content: (
            <VenueSetupForm
              venueData={venueData}
              onInputChange={onVenueDataChange}
              onSubmit={onVenueSubmit}
              onBack={onBack}
              loading={loading}
            />
          )
        };

      default:
        return {
          title: "Setup",
          description: "Setting up your venue...",
          content: <div>Loading...</div>
        };
    }
  };

  const stepContent = getStepContent();

  return (
    <>
      <CardHeader>
        <CardTitle>{stepContent.title}</CardTitle>
        <CardDescription>{stepContent.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        {stepContent.content}
      </CardContent>
    </>
  );
};
