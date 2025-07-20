
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ServiceCard } from "@/components/services/ServiceCard";
import ServiceDialog from "@/components/services/ServiceDialog";
import { BookingWindowManager } from "@/components/services/BookingWindowManager";
import { useServicesData } from "@/hooks/useServicesData";
import { useServiceForm } from "@/hooks/useServiceForm";
import { useBookingWindows } from "@/hooks/useBookingWindows";
import { getServiceWindows } from "@/utils/serviceHelpers";

const Services = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [managingWindowsServiceId, setManagingWindowsServiceId] = useState<string | null>(null);
  
  const { 
    services, 
    isServicesLoading, 
    createServiceMutation, 
    updateServiceMutation, 
    deleteServiceMutation 
  } = useServicesData();
  
  const {
    formData,
    editingServiceId,
    isEditing,
    updateFormData,
    resetForm,
    startEditing,
    startCreating,
  } = useServiceForm();

  // Fetch booking windows
  const { allBookingWindows: allWindows = [], isLoadingWindows, windowsError } = useBookingWindows();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    try {
      if (isEditing && editingServiceId) {
        await updateServiceMutation.mutateAsync({
          id: editingServiceId,
          updates: formData
        });
      } else {
        await createServiceMutation.mutateAsync(formData);
      }
      
      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    resetForm();
  };

  const handleEdit = (service: any) => {
    startEditing(service);
    setShowDialog(true);
  };

  const handleCreate = () => {
    startCreating();
    setShowDialog(true);
  };

  const handleDuplicate = (service: any) => {
    startCreating();
    updateFormData({
      title: `${service.title} (Copy)`,
      description: service.description || '',
      min_guests: service.min_guests,
      max_guests: service.max_guests,
      lead_time_hours: service.lead_time_hours,
      cancellation_window_hours: service.cancellation_window_hours,
      online_bookable: service.online_bookable,
      active: service.active,
      is_secret: service.is_secret,
      secret_slug: service.secret_slug ? `${service.secret_slug}-copy` : '',
      image_url: service.image_url || '',
      duration_rules: service.duration_rules || [],
      terms_and_conditions: service.terms_and_conditions || '',
      requires_payment: service.requires_payment,
      charge_type: service.charge_type === 'none' ? 'none' : service.charge_type,
      minimum_guests_for_charge: service.minimum_guests_for_charge || 8,
      charge_amount_per_guest: service.charge_amount_per_guest || 0,
    });
    setShowDialog(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      await deleteServiceMutation.mutateAsync(serviceId);
    }
  };

  const handleToggleActive = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    await updateServiceMutation.mutateAsync({
      id: serviceId,
      updates: {
        ...service,
        active: !service.active
      }
    });
  };

  const handleManageWindows = (serviceId: string) => {
    setManagingWindowsServiceId(serviceId);
  };

  const closeWindowsManager = () => {
    setManagingWindowsServiceId(null);
  };

  if (isServicesLoading) {
    return <div className="flex items-center justify-center h-64">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground">Manage your restaurant's services and booking options</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            serviceTags={[]}
            serviceWindows={getServiceWindows(service.id, allWindows)}
            isLoadingWindows={isLoadingWindows}
            windowsError={windowsError}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
            onManageWindows={handleManageWindows}
          />
        ))}
      </div>

      <ServiceDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        formData={formData}
        onFormDataChange={updateFormData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createServiceMutation.isPending || updateServiceMutation.isPending}
        isEditing={isEditing}
      />

      <BookingWindowManager
        serviceId={managingWindowsServiceId}
        open={!!managingWindowsServiceId}
        onOpenChange={(open) => {
          if (!open) {
            closeWindowsManager();
          }
        }}
      />
    </div>
  );
};

export default Services;
