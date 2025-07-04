
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
    useStandardTerms: true
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
      useStandardTerms: true
    });
    setEditingService(null);
  };

  const getStandardTerms = () => {
    return localStorage.getItem('standardTerms') || '';
  };

  const handleAddService = async () => {
    try {
      const termsToUse = newService.useStandardTerms !== false 
        ? getStandardTerms() 
        : newService.terms_and_conditions;

      const serviceData = {
        title: newService.title,
        description: newService.description,
        image_url: newService.image_url,
        tag_ids: newService.tag_ids,
        min_guests: newService.min_guests,
        max_guests: newService.max_guests,
        lead_time_hours: newService.lead_time_hours,
        cancellation_window_hours: newService.cancellation_window_hours,
        requires_deposit: newService.requires_deposit,
        deposit_per_guest: newService.deposit_per_guest,
        online_bookable: newService.online_bookable,
        active: newService.active,
        is_secret: newService.is_secret,
        secret_slug: newService.secret_slug,
        terms_and_conditions: termsToUse,
        duration_rules: newService.duration_rules
      };

      await createServiceMutation.mutateAsync(serviceData);
      return true;
    } catch (error) {
      console.error('Error creating service:', error);
      return false;
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return false;

    try {
      const termsToUse = editingService.useStandardTerms !== false 
        ? getStandardTerms() 
        : editingService.terms_and_conditions;

      const serviceData = {
        title: editingService.title,
        description: editingService.description,
        image_url: editingService.image_url,
        tag_ids: editingService.tag_ids,
        min_guests: editingService.min_guests,
        max_guests: editingService.max_guests,
        lead_time_hours: editingService.lead_time_hours,
        cancellation_window_hours: editingService.cancellation_window_hours,
        requires_deposit: editingService.requires_deposit,
        deposit_per_guest: editingService.deposit_per_guest,
        online_bookable: editingService.online_bookable,
        active: editingService.active,
        is_secret: editingService.is_secret,
        secret_slug: editingService.secret_slug,
        terms_and_conditions: termsToUse,
        duration_rules: editingService.duration_rules
      };

      await updateServiceMutation.mutateAsync({
        id: editingService.id,
        updates: serviceData
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
      useStandardTerms: service.terms_and_conditions === getStandardTerms()
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
