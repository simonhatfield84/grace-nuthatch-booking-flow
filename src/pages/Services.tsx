
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ServiceDialog from "@/components/services/ServiceDialog";
import { StandardServiceCard } from "@/components/services/StandardServiceCard";
import { useServicesData } from "@/hooks/useServicesData";
import { useServiceForm } from "@/hooks/useServiceForm";
import { useServiceActions } from "@/hooks/useServiceActions";
import { useBookingWindows } from "@/hooks/useBookingWindows";
import { getServiceWindows } from "@/utils/serviceHelpers";

export default function Services() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the data hook
  const {
    services,
    loading,
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

  // Use the actions hook
  const {
    handleDuplicateService,
    handleToggleActive,
    handleDeleteService,
    handleSubmitService,
  } = useServiceActions();

  // Load booking windows
  const { allBookingWindows, isLoadingWindows } = useBookingWindows();

  const handleCreateService = () => {
    startCreating();
    setDialogOpen(true);
  };

  const handleEditService = (service: any) => {
    console.log('Editing service:', service);
    startEditing(service);
    setDialogOpen(true);
  };

  const onDuplicateService = (service: any) => {
    const duplicatedData = handleDuplicateService(service);
    setDialogOpen(true);
  };

  const onToggleActive = async (serviceId: string) => {
    await handleToggleActive(serviceId, services);
  };

  const onDeleteService = async (serviceId: string) => {
    await handleDeleteService(serviceId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await handleSubmitService(formData, isEditing, editingServiceId);
      console.log('Service operation successful, closing dialog');
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error in form submission:', error);
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
              onDuplicate={onDuplicateService}
              onToggleActive={onToggleActive}
              onDelete={onDeleteService}
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
