
import { useServicesData } from './useServicesData';

export const useCreateService = () => {
  const { createServiceMutation } = useServicesData();
  return createServiceMutation;
};

export const useUpdateService = () => {
  const { updateServiceMutation } = useServicesData();
  return updateServiceMutation;
};

export const useServices = () => {
  const { services, isServicesLoading, servicesError } = useServicesData();
  return {
    services,
    isLoading: isServicesLoading,
    error: servicesError
  };
};
