
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useTags } from "@/hooks/useTags";
import { MediaUpload } from "@/components/services/MediaUpload";
import { ServiceBasicInfo } from "@/components/services/ServiceBasicInfo";
import { ServicePaymentSettings } from "@/components/services/ServicePaymentSettings";
import { ServiceBookingSettings } from "@/components/services/ServiceBookingSettings";
import { ServiceAdvancedSettings } from "@/components/services/ServiceAdvancedSettings";
import { useServiceDialog } from "@/hooks/useServiceDialog";

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingService?: any;
  newService: any;
  setEditingService: (service: any) => void;
  setNewService: (service: any) => void;
  onAddService: (serviceData?: any) => Promise<boolean>;
  onUpdateService: (serviceData?: any) => Promise<boolean>;
  createServiceMutation: any;
  updateServiceMutation: any;
  onReset: () => void;
}

const ServiceDialog = ({ 
  open, 
  onOpenChange, 
  editingService, 
  newService, 
  setEditingService, 
  setNewService, 
  onAddService, 
  onUpdateService, 
  createServiceMutation, 
  updateServiceMutation, 
  onReset 
}: ServiceDialogProps) => {
  const { toast } = useToast();
  const { tags, isLoading: isTagsLoading } = useTags();
  
  const {
    title, setTitle,
    description, setDescription,
    minGuests, setMinGuests,
    maxGuests, setMaxGuests,
    leadTimeHours, setLeadTimeHours,
    cancellationWindowHours, setCancellationWindowHours,
    requiresDeposit, setRequiresDeposit,
    depositPerGuest, setDepositPerGuest,
    onlineBookable, setOnlineBookable,
    active, setActive,
    isSecret, setIsSecret,
    secretSlug, setSecretSlug,
    imageUrl, setImageUrl,
    selectedTags,
    durationRules, setDurationRules,
    termsAndConditions, setTermsAndConditions,
    paymentSettings, setPaymentSettings,
    getServiceData,
    handleTagToggle,
  } = useServiceDialog(editingService, newService);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Service title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const serviceData = getServiceData();

      if (editingService) {
        const success = await onUpdateService(serviceData);
        if (success) {
          onOpenChange(false);
          onReset();
        }
      } else {
        const success = await onAddService(serviceData);
        if (success) {
          onOpenChange(false);
          onReset();
        }
      }
    } catch (error) {
      console.error('Service save error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Create New Service'}</DialogTitle>
            <DialogDescription>
              Configure your service settings and availability
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="booking">Booking</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <ServiceBasicInfo
              title={title}
              description={description}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
            />

            <ServiceBookingSettings
              minGuests={minGuests}
              maxGuests={maxGuests}
              leadTimeHours={leadTimeHours}
              cancellationWindowHours={cancellationWindowHours}
              requiresDeposit={requiresDeposit}
              depositPerGuest={depositPerGuest}
              onlineBookable={onlineBookable}
              durationRules={durationRules}
              onMinGuestsChange={setMinGuests}
              onMaxGuestsChange={setMaxGuests}
              onLeadTimeHoursChange={setLeadTimeHours}
              onCancellationWindowHoursChange={setCancellationWindowHours}
              onRequiresDepositChange={setRequiresDeposit}
              onDepositPerGuestChange={setDepositPerGuest}
              onOnlineBookableChange={setOnlineBookable}
              onDurationRulesChange={setDurationRules}
            />

            <ServicePaymentSettings
              paymentSettings={paymentSettings}
              onPaymentSettingsChange={setPaymentSettings}
            />

            <TabsContent value="media" className="space-y-6">
              <MediaUpload
                imageUrl={imageUrl}
                onImageChange={setImageUrl}
                onRemove={() => setImageUrl('')}
              />
            </TabsContent>

            <ServiceAdvancedSettings
              active={active}
              isSecret={isSecret}
              secretSlug={secretSlug}
              termsAndConditions={termsAndConditions}
              selectedTags={selectedTags}
              tags={tags}
              isTagsLoading={isTagsLoading}
              onActiveChange={setActive}
              onIsSecretChange={setIsSecret}
              onSecretSlugChange={setSecretSlug}
              onTermsAndConditionsChange={setTermsAndConditions}
              onTagToggle={handleTagToggle}
            />
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
            >
              {createServiceMutation.isPending || updateServiceMutation.isPending ? 'Saving...' : 'Save Service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDialog;
