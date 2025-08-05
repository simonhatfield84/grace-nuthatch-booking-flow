import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ServiceDialog from "@/components/services/ServiceDialog";
import { StandardServiceCard } from "@/components/services/StandardServiceCard";
import { useServicesData } from "@/hooks/useServicesData";
import { useServiceForm } from "@/hooks/useServiceForm";
import { useBookingWindows } from "@/hooks/useBookingWindows";
import { getServiceWindows } from "@/utils/serviceHelpers";

export default function Services() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Use the data hook
  const {
    services,
    loading,
    createService,
    updateService,
    deleteService,
  } = useServicesData();

  // Use the form hook
  const {
    formData,
    editingServiceId,
    updateFormData,
    resetForm,
    startEditing,
    startCreating,
    isEditing,
  } = useServiceForm();

  // Load booking windows
  const { allBookingWindows, isLoadingWindows } = useBookingWindows();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateService = () => {
    startCreating();
    setDialogOpen(true);
  };

  const handleEditService = (service: any) => {
    console.log('Editing service:', service);
    startEditing(service);
    setDialogOpen(true);
  };

  const handleDuplicateService = (service: any) => {
    console.log('Duplicating service:', service);
    
    // Prepare the duplicated form data
    const duplicatedFormData = {
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
    };
    
    // Reset to create mode and set the form data in one go
    resetForm();
    setTimeout(() => {
      updateFormData(duplicatedFormData);
      setDialogOpen(true);
    }, 0);
  };

  const handleToggleActive = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      try {
        // Ensure all required ServiceFormData fields are present
        const serviceUpdate = {
          title: service.title,
          description: service.description || '', // Provide default empty string if missing
          min_guests: service.min_guests,
          max_guests: service.max_guests,
          lead_time_hours: service.lead_time_hours,
          cancellation_window_hours: service.cancellation_window_hours,
          online_bookable: service.online_bookable,
          active: !service.active, // Toggle the active status
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
        };
        await updateService(serviceId, serviceUpdate);
      } catch (error) {
        console.error('Error toggling service active status:', error);
      }
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteService(serviceId);
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Starting form submission...');
    console.log('Form data before submission:', formData);
    console.log('Is editing:', isEditing, 'Service ID:', editingServiceId);
    
    setIsSubmitting(true);
    
    try {
      let result;
      if (isEditing && editingServiceId) {
        console.log('Updating service with ID:', editingServiceId);
        result = await updateService(editingServiceId, formData);
        console.log('Update result:', result);
      } else {
        console.log('Creating new service');
        result = await createService(formData);
        console.log('Create result:', result);
      }
      
      console.log('Service operation successful, closing dialog');
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    console.log('Form cancelled');
    setDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return <div>Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground">
            Manage your venue's services and their settings
          </p>
        </div>
        <Button onClick={handleCreateService}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services?.map((service) => {
          const serviceWindows = getServiceWindows(service.id, allBookingWindows);

          return (
            <StandardServiceCard
              key={service.id}
              service={service}
              serviceWindows={serviceWindows}
              isLoadingWindows={isLoadingWindows}
              onEdit={handleEditService}
              onDuplicate={handleDuplicateService}
              onToggleActive={handleToggleActive}
              onDelete={handleDeleteService}
            />
          );
        })}
      </div>

      <ServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formData={formData}
        onFormDataChange={updateFormData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        isEditing={isEditing}
      />
    </div>
  );
}
