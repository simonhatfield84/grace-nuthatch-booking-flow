
import React from 'react';
import { Card } from '@/components/ui/card';
import { SetupHeader } from './SetupHeader';
import { SetupContent } from './SetupContent';
import { useSetupFlow } from '@/hooks/useSetupFlow';

export const SetupContainer: React.FC = () => {
  const {
    state,
    updateAdminData,
    updateVenueData,
    createAdminAccount,
    verifyCode,
    resendVerificationCode,
    createVenue,
    updateState
  } = useSetupFlow();

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAdminAccount();
  };

  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createVenue();
  };

  const handleBack = () => {
    if (state.step === 'code-verification') {
      updateState({ step: 'admin' });
    } else if (state.step === 'venue') {
      updateState({ step: 'code-verification' });
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <SetupHeader currentStep={state.step} />

      <Card>
        <SetupContent
          step={state.step}
          adminData={state.adminData}
          venueData={state.venueData}
          loading={state.loading}
          verifyLoading={state.verifyLoading}
          resendLoading={state.resendLoading}
          error={state.error}
          onAdminDataChange={updateAdminData}
          onVenueDataChange={updateVenueData}
          onAdminSubmit={handleAdminSubmit}
          onVenueSubmit={handleVenueSubmit}
          onBack={handleBack}
          onVerifyCode={verifyCode}
          onResendCode={resendVerificationCode}
        />
      </Card>
    </div>
  );
};
