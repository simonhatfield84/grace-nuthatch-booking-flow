
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SetupContainer } from '@/components/setup/SetupContainer';
import { SetupComplete } from '@/components/setup/SetupComplete';
import { useSetupFlow } from '@/hooks/useSetupFlow';

const Setup = () => {
  const navigate = useNavigate();
  const { state } = useSetupFlow();

  if (state.step === 'complete') {
    return (
      <SetupComplete
        isUserActive={true}
        approvalEmailSent={true}
        approvalEmailError={null}
        loading={false}
        onResendApproval={() => {}}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SetupContainer />
    </div>
  );
};

export default Setup;
