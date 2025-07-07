
import { useState } from "react";
import { useServices } from "@/hooks/useServices";

export const useServiceForm = () => {
  const {
    createServiceMutation,
    updateServiceMutation,
    deleteServiceMutation
  } = useServices();

  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    image_url: '',
    tag_ids: [],
    min_guests: 1,
    max_guests: 8,
    lead_time_hours: 2,
    cancellation_window_hours: 24,
    requires_deposit: false,
    deposit_per_guest: 0,
    online_bookable: true,
    active: true,
    is_secret: false,
    secret_slug: '',
    terms_and_conditions: '',
    duration_rules: [],
    useStandardTerms: true,
    // Add payment-related defaults
    requires_payment: false,
    charge_type: 'none',
    minimum_guests_for_charge: 8,
    charge_amount_per_guest: 0,
  });

  const resetForm = () => {
    setNewService({
      title: '',
      description: '',
      image_url: '',
      tag_ids: [],
      min_guests: 1,
      max_guests: 8,
      lead_time_hours: 2,
      cancellation_window_hours: 24,
      requires_deposit: false,
      deposit_per_guest: 0,
      online_bookable: true,
      active: true,
      is_secret: false,
      secret_slug: '',
      terms_and_conditions: '',
      duration_rules: [],
      useStandardTerms: true,
      // Reset payment-related fields
      requires_payment: false,
      charge_type: 'none',
      minimum_guests_for_charge: 8,
      charge_amount_per_guest: 0,
    });
    setEditingService(null);
  };

  const getStandardTerms = () => {
    return localStorage.getItem('standardTerms') || '';
  };

  // Modified to accept serviceData directly
  const handleAddService = async (serviceData = null) => {
    try {
      const dataToUse = serviceData || newService;
      const termsToUse = dataToUse.useStandardTerms !== false 
        ? getStandardTerms() 
        : dataToUse.terms_and_conditions;

      const finalServiceData = {
        title: dataToUse.title,
        description: dataToUse.description,
        image_url: dataToUse.image_url,
        tag_ids: dataToUse.tag_ids,
        min_guests: dataToUse.min_guests,
        max_guests: dataToUse.max_guests,
        lead_time_hours: dataToUse.lead_time_hours,
        cancellation_window_hours: dataToUse.cancellation_window_hours,
        requires_deposit: dataToUse.requires_deposit,
        deposit_per_guest: dataToUse.deposit_per_guest,
        online_bookable: dataToUse.online_bookable,
        active: dataToUse.active,
        is_secret: dataToUse.is_secret,
        secret_slug: dataToUse.secret_slug,
        terms_and_conditions: termsToUse,
        duration_rules: dataToUse.duration_rules,
        // Add payment-related fields
        requires_payment: dataToUse.requires_payment,
        charge_type: dataToUse.charge_type,
        minimum_guests_for_charge: dataToUse.minimum_guests_for_charge,
        charge_amount_per_guest: dataToUse.charge_amount_per_guest,
      };

      await createServiceMutation.mutateAsync(finalServiceData);
      return true;
    } catch (error) {
      console.error('Error creating service:', error);
      return false;
    }
  };

  // Modified to accept serviceData directly
  const handleUpdateService = async (serviceData = null) => {
    if (!editingService && !serviceData) return false;

    try {
      const dataToUse = serviceData || editingService;
      const termsToUse = dataToUse.useStandardTerms !== false 
        ? getStandardTerms() 
        : dataToUse.terms_and_conditions;

      const finalServiceData = {
        title: dataToUse.title,
        description: dataToUse.description,
        image_url: dataToUse.image_url,
        tag_ids: dataToUse.tag_ids,
        min_guests: dataToUse.min_guests,
        max_guests: dataToUse.max_guests,
        lead_time_hours: dataToUse.lead_time_hours,
        cancellation_window_hours: dataToUse.cancellation_window_hours,
        requires_deposit: dataToUse.requires_deposit,
        deposit_per_guest: dataToUse.deposit_per_guest,
        online_bookable: dataToUse.online_bookable,
        active: dataToUse.active,
        is_secret: dataToUse.is_secret,
        secret_slug: dataToUse.secret_slug,
        terms_and_conditions: termsToUse,
        duration_rules: dataToUse.duration_rules,
        // Add payment-related fields
        requires_payment: dataToUse.requires_payment,
        charge_type: dataToUse.charge_type,
        minimum_guests_for_charge: dataToUse.minimum_guests_for_charge,
        charge_amount_per_guest: dataToUse.charge_amount_per_guest,
      };

      const serviceId = serviceData ? (serviceData.id || editingService?.id) : editingService.id;
      
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
    setEditingService({
      ...service,
      useStandardTerms: service.terms_and_conditions === getStandardTerms()
    });
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
    setNewService({
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
      // Copy payment-related fields
      requires_payment: service.requires_payment,
      charge_type: service.charge_type,
      minimum_guests_for_charge: service.minimum_guests_for_charge,
      charge_amount_per_guest: service.charge_amount_per_guest,
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
