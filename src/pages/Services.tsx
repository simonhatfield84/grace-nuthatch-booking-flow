
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceDialog } from "@/components/services/ServiceDialog";
import { useServices } from "@/hooks/useServices";

const Services = () => {
  const {
    services,
    isServicesLoading,
    createServiceMutation,
    updateServiceMutation,
    deleteServiceMutation
  } = useServices();

  const [showDialog, setShowDialog] = useState(false);
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
      // Process terms based on useStandardTerms flag
      const termsToUse = newService.useStandardTerms !== false 
        ? getStandardTerms() 
        : newService.terms_and_conditions;

      // Create clean service data without UI-only properties
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
      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating service:', error);
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    try {
      // Process terms based on useStandardTerms flag
      const termsToUse = editingService.useStandardTerms !== false 
        ? getStandardTerms() 
        : editingService.terms_and_conditions;

      // Create clean service data without UI-only properties
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
      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleEditService = (service) => {
    setEditingService({
      ...service,
      useStandardTerms: service.terms_and_conditions === getStandardTerms()
    });
    setShowDialog(true);
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
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onEdit={handleEditService}
            onDelete={handleDeleteService}
          />
        ))}
      </div>

      <ServiceDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        editingService={editingService}
        newService={newService}
        setEditingService={setEditingService}
        setNewService={setNewService}
        onAddService={handleAddService}
        onUpdateService={handleUpdateService}
        createServiceMutation={createServiceMutation}
        updateServiceMutation={updateServiceMutation}
        onReset={resetForm}
      />
    </div>
  );
};

export default Services;
