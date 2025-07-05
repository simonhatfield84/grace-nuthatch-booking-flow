
import { useSetupState } from './useSetupState';
import { useSetupActions } from './useSetupActions';

export const useSetupFlow = () => {
  const setupState = useSetupState();
  const setupActions = useSetupActions();

  return {
    ...setupState,
    ...setupActions
  };
};
