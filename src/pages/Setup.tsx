
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SetupContainer } from '@/components/setup/SetupContainer';
import { SetupComplete } from '@/components/setup/SetupComplete';
import { useSetupFlow } from '@/hooks/useSetupFlow';
import { useUserStatus } from '@/hooks/useSetup';

const Setup = () => {
  const navigate = useNavigate();
  const { state, resendApprovalRequest } = useSetupFlow();
  const { data: userStatus, isLoading: statusLoading } = useUserStatus();

  if (state.step === 'complete') {
    return (
      <SetupComplete
        isUserActive={userStatus?.is_active || false}
        approvalEmailSent={state.approvalEmailSent}
        approvalEmailError={state.approvalEmailError}
        loading={state.loading}
        onResendApproval={resendApprovalRequest}
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
