
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ServiceCard } from "@/components/services/ServiceCard";
import ServiceDialog from "@/components/services/ServiceDialog";
import { BookingWindowManager } from "@/components/services/BookingWindowManager";
import { useServices } from "@/hooks/useServices";
import { useServiceForm } from "@/hooks/useServiceForm";
import { useServiceDialogs } from "@/hooks/useServiceDialogs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBookingWindows } from "@/hooks/useBookingWindows";
import { getServiceTags, getServiceWindows } from "@/utils/serviceHelpers";

const Services = () => {
  const { services, isServicesLoading, updateServiceMutation } = useServices();
  
  const {
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
    createServiceMutation
  } = useServiceForm();

  const {
    showDialog,
    setShowDialog,
    managingWindowsServiceId,
    handleManageWindows,
    closeWindowsManager
  } = useServiceDialogs();

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
  const { allBookingWindows: allWindows = [], isLoadingWindows: isWindowsLoading, windowsError } = useBookingWindows();

  const handleServiceAdd = async (): Promise<boolean> => {
    try {
      await handleAddService();
      setShowDialog(false);
      resetForm();
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleServiceUpdate = async (): Promise<boolean> => {
    try {
      await handleUpdateService();
      setShowDialog(false);
      resetForm();
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleServiceEdit = (service) => {
    handleEditService(service);
    setShowDialog(true);
  };

  const handleServiceDuplicate = (service) => {
    handleDuplicateService(service);
    setShowDialog(true);
  };

  const handleServiceToggleActive = async (serviceId) => {
    await handleToggleActive(serviceId, services, updateServiceMutation);
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
            serviceTags={getServiceTags(service, allTags)}
            serviceWindows={getServiceWindows(service.id, allWindows)}
            isLoadingWindows={isWindowsLoading}
            windowsError={windowsError}
            onEdit={handleServiceEdit}
            onDuplicate={handleServiceDuplicate}
            onDelete={handleDeleteService}
            onToggleActive={handleServiceToggleActive}
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
        onAddService={handleServiceAdd}
        onUpdateService={handleServiceUpdate}
        createServiceMutation={createServiceMutation}
        updateServiceMutation={updateServiceMutation}
        onReset={resetForm}
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
