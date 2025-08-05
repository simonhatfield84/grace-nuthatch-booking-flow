
import { useState } from "react";
import { Plus, CreditCard, Users, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ServiceDialog from "@/components/services/ServiceDialog";
import { useServicesData } from "@/hooks/useServicesData";
import { useServiceForm } from "@/hooks/useServiceForm";

export default function Services() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Use the data hook
  const {
    services,
    loading,
    createService,
    updateService,
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateService = () => {
    startCreating();
    setDialogOpen(true);
  };

  const handleEditService = (service: any) => {
    startEditing(service);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (isEditing && editingServiceId) {
        await updateService(editingServiceId, formData);
      } else {
        await createService(formData);
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the hooks
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
    resetForm();
  };

  const formatPrice = (pence: number) => {
    return `£${(pence / 100).toFixed(2)}`;
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
        {services?.map((service) => (
          <Card key={service.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{service.title}</CardTitle>
                <div className="flex gap-2">
                  {service.requires_payment && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Payment
                    </Badge>
                  )}
                  {service.active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {service.description || "No description provided"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{service.min_guests}-{service.max_guests} guests</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{service.lead_time_hours}h lead time</span>
                </div>
              </div>
              
              {service.requires_payment && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground">
                    Payment Required
                  </p>
                  <div className="text-sm">
                    {service.charge_type === 'all_reservations' && (
                      <span>{formatPrice(service.charge_amount_per_guest)} per guest</span>
                    )}
                    {service.charge_type === 'large_groups' && (
                      <span>
                        {formatPrice(service.charge_amount_per_guest)} per guest 
                        (groups of {service.minimum_guests_for_charge}+)
                      </span>
                    )}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleEditService(service)}
              >
                Edit Service
              </Button>
            </CardContent>
          </Card>
        ))}
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
