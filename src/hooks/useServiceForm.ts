
import { useState } from 'react';
import { ServiceFormData, Service } from './useServicesData';

const DEFAULT_FORM_DATA: ServiceFormData = {
  title: '',
  description: '',
  min_guests: 1,
  max_guests: 8,
  lead_time_hours: 2,
  cancellation_window_hours: 24,
  online_bookable: true,
  active: true,
  is_secret: false,
  secret_slug: '',
  image_url: '',
  duration_rules: [],
  terms_and_conditions: '',
};

export const useServiceForm = () => {
  const [formData, setFormData] = useState<ServiceFormData>(DEFAULT_FORM_DATA);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingServiceId(null);
  };

  const startEditing = (service: Service) => {
    setEditingServiceId(service.id);
    setFormData({
      title: service.title,
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
    });
  };

  const startCreating = () => {
    resetForm();
  };

  const updateFormData = (updates: Partial<ServiceFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const isEditing = editingServiceId !== null;

  return {
    formData,
    editingServiceId,
    isEditing,
    updateFormData,
    resetForm,
    startEditing,
    startCreating,
  };
};
