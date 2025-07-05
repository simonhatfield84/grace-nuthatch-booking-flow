
import { useSetupState } from './useSetupState';
import { useSetupActions } from './useSetupActions';

export const useSetupFlow = () => {
  const {
    state,
    updateState,
    updateAdminData,
    updateVenueData,
    setStep,
    setError,
    setLoading,
    setVerifyLoading,
    setResendLoading,
    setApprovalEmailStatus,
    setVenueId
  } = useSetupState();

  const setupActions = useSetupActions({
    state,
    setError,
    setLoading,
    setVerifyLoading,
    setResendLoading,
    setStep,
    setApprovalEmailStatus,
    setVenueId
  });

  return {
    state,
    updateState,
    updateAdminData,
    updateVenueData,
    setStep,
    setError,
    setLoading,
    setVerifyLoading,
    setResendLoading,
    setApprovalEmailStatus,
    setVenueId,
    ...setupActions
  };
};
