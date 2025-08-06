
import { toast } from 'sonner';
import { ServiceFormData, useServicesData } from './useServicesData';
import { useServiceForm } from './useServiceForm';

export const useServiceActions = () => {
  const {
    createService,
    updateService,
    deleteService,
  } = useServicesData();

  const {
    updateFormData,
    resetForm,
  } = useServiceForm();

  const handleDuplicateService = (service: any) => {
    console.log('Duplicating service:', service);
    
    const duplicatedFormData: ServiceFormData = {
      title: `${service.title} (Copy)`,
      description: service.description || '',
      min_guests: service.min_guests,
      max_guests: service.max_guests,
      lead_time_hours: service.lead_time_hours,
      cancellation_window_hours: service.cancellation_window_hours,
      online_bookable: service.online_bookable,
      active: service.active,
      is_secret: service.is_secret,
      secret_slug: service.secret_slug || '',
      image_url: service.image_url || '',
      duration_rules: service.duration_rules || [],
      terms_and_conditions: service.terms_and_conditions || '',
      requires_payment: service.requires_payment,
      charge_type: service.charge_type,
      minimum_guests_for_charge: service.minimum_guests_for_charge || 8,
      charge_amount_per_guest: service.charge_amount_per_guest || 0,
      refund_window_hours: service.refund_window_hours || 24,
      auto_refund_enabled: service.auto_refund_enabled || false,
      refund_policy_text: service.refund_policy_text || '',
    };
    
    resetForm();
    setTimeout(() => {
      updateFormData(duplicatedFormData);
    }, 0);

    return duplicatedFormData;
  };

  const handleToggleActive = async (serviceId: string, services: any[]) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    try {
      const serviceUpdate: Partial<ServiceFormData> = {
        active: !service.active,
      };
      
      await updateService(serviceId, serviceUpdate);
      toast.success(`Service ${service.active ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      console.error('Error toggling service active status:', error);
      toast.error('Failed to update service status');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteService(serviceId);
        toast.success('Service deleted successfully');
      } catch (error) {
        console.error('Error deleting service:', error);
        toast.error('Failed to delete service');
      }
    }
  };

  const handleSubmitService = async (
    formData: ServiceFormData,
    isEditing: boolean,
    editingServiceId: string | null
  ) => {
    console.log('Starting form submission...');
    console.log('Form data before submission:', formData);
    console.log('Is editing:', isEditing, 'Service ID:', editingServiceId);
    
    try {
      let result;
      if (isEditing && editingServiceId) {
        console.log('Updating service with ID:', editingServiceId);
        result = await updateService(editingServiceId, formData);
        console.log('Update result:', result);
        toast.success('Service updated successfully');
      } else {
        console.log('Creating new service');
        result = await createService(formData);
        console.log('Create result:', result);
        toast.success('Service created successfully');
      }
      
      return result;
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error(isEditing ? 'Failed to update service' : 'Failed to create service');
      throw error;
    }
  };

  return {
    handleDuplicateService,
    handleToggleActive,
    handleDeleteService,
    handleSubmitService,
  };
};
