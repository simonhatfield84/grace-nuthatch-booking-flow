
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CreditCard, Users, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceDialog from "@/components/services/ServiceDialog";
import { ServicePaymentSettings } from "@/components/services/ServicePaymentSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useServicesData } from "@/hooks/useServicesData";

export default function Services() {
  const [editingPaymentService, setEditingPaymentService] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    services,
    isLoading,
    dialogOpen,
    setDialogOpen,
    formData,
    updateFormData,
    isSubmitting,
    isEditing,
    handleCreateService,
    handleEditService,
    handleSubmit,
    handleCancel
  } = useServicesData();

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({
        title: "Success",
        description: "Service updated successfully",
      });
      setEditingPaymentService(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    },
  });

  const handlePaymentSettingsUpdate = (serviceId: string, settings: any) => {
    updateServiceMutation.mutate({ id: serviceId, updates: settings });
  };

  const formatPrice = (pence: number) => {
    return `£${(pence / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return <div>Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground">
            Manage your venue's services and payment settings
          </p>
        </div>
        <Button onClick={handleCreateService}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Service Overview</TabsTrigger>
          <TabsTrigger value="payments">Payment Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                  
                  {service.requires_payment && service.charge_type === 'per_guest' && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(service.charge_amount_per_guest)} per guest
                        {service.minimum_guests_for_charge > 1 && 
                          ` (min ${service.minimum_guests_for_charge} guests)`
                        }
                      </p>
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
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="space-y-6">
            {services?.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {service.title}
                        {service.requires_payment && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            Payment Required
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Configure payment settings for this service
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setEditingPaymentService(service)}
                    >
                      Configure Payments
                    </Button>
                  </div>
                </CardHeader>
                {service.requires_payment && (
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm font-medium">Charge Type</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {service.charge_type?.replace('_', ' ') || 'Not set'}
                        </p>
                      </div>
                      {service.charge_type === 'per_guest' && (
                        <>
                          <div>
                            <p className="text-sm font-medium">Amount Per Guest</p>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(service.charge_amount_per_guest || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Minimum Guests</p>
                            <p className="text-sm text-muted-foreground">
                              {service.minimum_guests_for_charge || 1} guests
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

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

      {editingPaymentService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-1 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="text-lg font-semibold">Payment Settings - {editingPaymentService.title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingPaymentService(null)}
              >
                ×
              </Button>
            </div>
            <div className="p-4">
              <ServicePaymentSettings
                service={editingPaymentService}
                onUpdate={(settings) => 
                  handlePaymentSettingsUpdate(editingPaymentService.id, settings)
                }
                isLoading={updateServiceMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
