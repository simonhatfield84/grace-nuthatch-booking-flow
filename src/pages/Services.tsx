import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceDialog } from "@/components/services/ServiceDialog";
import { useServices } from "@/hooks/useServices";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBookingWindows } from "@/hooks/useBookingWindows";

const Services = () => {
  const {
    services,
    isServicesLoading,
    createServiceMutation,
    updateServiceMutation,
    deleteServiceMutation
  } = useServices();

  // Fetch tags
  const { data: allTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch booking windows for all services
  const { data: allWindows = [], isLoading: isWindowsLoading, error: windowsError } = useBookingWindows();

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
    setShowDialog(true);
  };

  const handleToggleActive = async (serviceId) => {
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

  const handleManageWindows = (serviceId) => {
    // For now, just log - this would typically open a booking windows management dialog
    console.log('Manage windows for service:', serviceId);
  };

  // Helper function to get tags for a specific service
  const getServiceTags = (service) => {
    if (!service.tag_ids || !Array.isArray(service.tag_ids)) return [];
    return allTags.filter(tag => service.tag_ids.includes(tag.id));
  };

  // Helper function to get booking windows for a specific service
  const getServiceWindows = (serviceId) => {
    return allWindows.filter(window => window.service_id === serviceId);
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
            serviceTags={getServiceTags(service)}
            serviceWindows={getServiceWindows(service.id)}
            isLoadingWindows={isWindowsLoading}
            windowsError={windowsError}
            onEdit={handleEditService}
            onDuplicate={handleDuplicateService}
            onDelete={handleDeleteService}
            onToggleActive={handleToggleActive}
            onManageWindows={handleManageWindows}
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
