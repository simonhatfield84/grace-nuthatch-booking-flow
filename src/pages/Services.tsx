
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BookingWindowManager } from "@/components/services/BookingWindowManager";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceDialog } from "@/components/services/ServiceDialog";
import { DurationRule } from "@/hooks/useServiceDurationRules";
import { useServices } from "@/hooks/useServices";
import { useBookingWindows } from "@/hooks/useBookingWindows";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Services = () => {
  const {
    services,
    isServicesLoading,
    createServiceMutation,
    updateServiceMutation,
    deleteServiceMutation
  } = useServices();

  const {
    isLoadingWindows,
    windowsError,
    getWindowsForService
  } = useBookingWindows();

  // Fetch tags from database for display
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

  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [showWindowManager, setShowWindowManager] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);

  const [newService, setNewService] = useState({
    title: "",
    description: "",
    image_url: "",
    tag_ids: [] as string[],
    min_guests: 1,
    max_guests: 8,
    lead_time_hours: 2,
    cancellation_window_hours: 24,
    requires_deposit: false,
    deposit_per_guest: 0,
    online_bookable: true,
    active: true,
    is_secret: false,
    secret_slug: null,
    terms_and_conditions: "",
    useStandardTerms: true,
    duration_rules: [] as DurationRule[]
  });

  // Helper function to get tags for a service
  const getTagsForService = (tagIds: string[]) => {
    return allTags.filter(tag => tagIds.includes(tag.id));
  };

  const generateSecretSlug = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const getStandardTerms = () => {
    return localStorage.getItem('standardTerms') || '';
  };

  const handleAddService = () => {
    const serviceData = {
      ...newService,
      secret_slug: newService.is_secret ? generateSecretSlug() : null
    };
    createServiceMutation.mutate(serviceData);
    resetServiceForm();
    setShowServiceDialog(false);
  };

  const handleUpdateService = () => {
    const updatedService = {
      ...editingService,
      secret_slug: editingService.is_secret 
        ? (editingService.secret_slug || generateSecretSlug())
        : null
    };
    updateServiceMutation.mutate({ id: editingService.id, updates: updatedService });
    setEditingService(null);
    setShowServiceDialog(false);
  };

  const handleDeleteService = (serviceId: string) => {
    deleteServiceMutation.mutate(serviceId);
  };

  const handleEditService = (service: any) => {
    setEditingService({
      ...service,
      tagIds: service.tag_ids || [],
      durationRules: Array.isArray(service.duration_rules) ? service.duration_rules : [],
      useStandardTerms: !service.terms_and_conditions || service.terms_and_conditions === getStandardTerms()
    });
    setShowServiceDialog(true);
  };

  const handleDuplicateService = (service: any) => {
    const duplicatedService = {
      ...service,
      title: `${service.title} (Copy)`,
      active: false,
      secret_slug: service.is_secret ? generateSecretSlug() : null,
      id: undefined // Remove ID so a new one will be generated
    };
    createServiceMutation.mutate(duplicatedService);
  };

  const resetServiceForm = () => {
    setNewService({
      title: "",
      description: "",
      image_url: "",
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
      secret_slug: null,
      terms_and_conditions: "",
      useStandardTerms: true,
      duration_rules: []
    });
    setEditingService(null);
  };

  const toggleServiceActive = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      updateServiceMutation.mutate({ 
        id: serviceId, 
        updates: { active: !service.active }
      });
    }
  };

  const handleManageWindows = (serviceId: string) => {
    setCurrentServiceId(serviceId);
    setShowWindowManager(true);
  };

  if (isServicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground">Manage your restaurant services and booking windows</p>
        </div>
        <Button onClick={() => setShowServiceDialog(true)}>
          <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
          Add Service
        </Button>
      </div>

      {/* Service Dialog */}
      <ServiceDialog
        open={showServiceDialog}
        onOpenChange={setShowServiceDialog}
        editingService={editingService}
        newService={newService}
        setEditingService={setEditingService}
        setNewService={setNewService}
        onAddService={handleAddService}
        onUpdateService={handleUpdateService}
        createServiceMutation={createServiceMutation}
        updateServiceMutation={updateServiceMutation}
        onReset={resetServiceForm}
      />

      {/* Booking Window Manager */}
      {currentServiceId && (
        <BookingWindowManager
          serviceId={currentServiceId}
          open={showWindowManager}
          onOpenChange={(open) => {
            setShowWindowManager(open);
            if (!open) setCurrentServiceId(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const serviceTags = getTagsForService(service.tag_ids || []);
          const serviceWindows = getWindowsForService(service.id);
          
          return (
            <ServiceCard
              key={service.id}
              service={service}
              serviceTags={serviceTags}
              serviceWindows={serviceWindows}
              isLoadingWindows={isLoadingWindows}
              windowsError={windowsError}
              onEdit={handleEditService}
              onDuplicate={handleDuplicateService}
              onDelete={handleDeleteService}
              onToggleActive={toggleServiceActive}
              onManageWindows={handleManageWindows}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Services;
