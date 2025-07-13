
import { useServices } from "@/hooks/useServices";
import { useServiceState } from "@/hooks/useServiceState";
import { SERVICE_DEFAULTS } from "@/constants/serviceDefaults";

export const useServiceForm = () => {
  const {
    createServiceMutation,
    updateServiceMutation,
    deleteServiceMutation
  } = useServices();

  const {
    editingService,
    setEditingService,
    newService,
    setNewService,
    resetForm
  } = useServiceState();

  const getStandardTerms = () => {
    return localStorage.getItem('standardTerms') || '';
  };

  const handleAddService = async (serviceData = null) => {
    try {
      const dataToUse = serviceData || newService;
      const termsToUse = dataToUse.useStandardTerms !== false 
        ? getStandardTerms() 
        : dataToUse.terms_and_conditions;

      const finalServiceData = {
        ...dataToUse,
        terms_and_conditions: termsToUse,
      };

      console.log('Creating service with final data:', finalServiceData);
      await createServiceMutation.mutateAsync(finalServiceData);
      return true;
    } catch (error) {
      console.error('Error creating service:', error);
      return false;
    }
  };

  const handleUpdateService = async (serviceData = null) => {
    if (!editingService && !serviceData) return false;

    try {
      const dataToUse = serviceData || editingService;
      const termsToUse = dataToUse.useStandardTerms !== false 
        ? getStandardTerms() 
        : dataToUse.terms_and_conditions;

      const finalServiceData = {
        ...dataToUse,
        terms_and_conditions: termsToUse,
      };

      const serviceId = serviceData ? (serviceData.id || editingService?.id) : editingService.id;
      
      console.log('Updating service with final data:', finalServiceData);
      await updateServiceMutation.mutateAsync({
        id: serviceId,
        updates: finalServiceData
      });
      return true;
    } catch (error) {
      console.error('Error updating service:', error);
      return false;
    }
  };

  const handleEditService = (service) => {
    console.log('Raw service data from database:', service);
    
    // Preserve all payment-related properties with proper null/undefined handling
    const editingData = {
      ...service,
      useStandardTerms: service.terms_and_conditions === getStandardTerms(),
      // Use nullish coalescing to properly handle false values
      requires_payment: service.requires_payment ?? false,
      charge_type: service.charge_type ?? 'none',
      charge_amount_per_guest: service.charge_amount_per_guest ?? 0,
      minimum_guests_for_charge: service.minimum_guests_for_charge ?? 8,
    };
    
    console.log('Setting editing service with processed data:', editingData);
    setEditingService(editingData);
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteServiceMutation.mutateAsync(serviceId);
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  const handleDuplicateService = (service) => {
    // Clear editing service first to ensure we're in "add" mode
    setEditingService(null);
    
    setNewService({
      ...SERVICE_DEFAULTS,
      title: `${service.title} (Copy)`,
      description: service.description,
      image_url: service.image_url,
      tag_ids: service.tag_ids || [],
      min_guests: service.min_guests,
      max_guests: service.max_guests,
      lead_time_hours: service.lead_time_hours,
      cancellation_window_hours: service.cancellation_window_hours,
      requires_deposit: service.requires_deposit,
      deposit_per_guest: service.deposit_per_guest,
      online_bookable: service.online_bookable,
      active: service.active,
      is_secret: service.is_secret,
      secret_slug: service.secret_slug ? `${service.secret_slug}-copy` : '',
      terms_and_conditions: service.terms_and_conditions,
      duration_rules: service.duration_rules || [],
      useStandardTerms: service.terms_and_conditions === getStandardTerms(),
      // Preserve payment settings with proper null handling
      requires_payment: service.requires_payment ?? false,
      charge_type: service.charge_type ?? 'none',
      minimum_guests_for_charge: service.minimum_guests_for_charge ?? 8,
      charge_amount_per_guest: service.charge_amount_per_guest ?? 0,
    });
  };

  const handleToggleActive = async (serviceId, services, updateServiceMutation) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    try {
      await updateServiceMutation.mutateAsync({
        id: serviceId,
        updates: { active: !service.active }
      });
    } catch (error) {
      console.error('Error toggling service active state:', error);
    }
  };

  return {
    editingService,
    setEditingService,
    newService,
    setNewService,
    resetForm,
    handleAddService,
    handleUpdateService,
    handleEditService,
    handleDeleteService,
    handleDuplicateService,
    handleToggleActive,
    createServiceMutation,
    updateServiceMutation
  };
};
