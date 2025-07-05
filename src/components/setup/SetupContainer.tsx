
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
    console.log('🎯 handleAdminSubmit called');
    console.log('📋 Current state:', state);
    
    e.preventDefault();
    console.log('📝 Form prevented default, calling createAdminAccount...');
    
    try {
      const result = await createAdminAccount();
      console.log('📋 createAdminAccount result:', result);
    } catch (error) {
      console.error('💥 Error in handleAdminSubmit:', error);
    }
  };

  const handleVenueSubmit = async (e: React.FormEvent) => {
    console.log('🏢 handleVenueSubmit called');
    e.preventDefault();
    
    try {
      const result = await createVenue();
      console.log('📋 createVenue result:', result);
    } catch (error) {
      console.error('💥 Error in handleVenueSubmit:', error);
    }
  };

  const handleBack = () => {
    console.log('🔙 handleBack called, current step:', state.step);
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
