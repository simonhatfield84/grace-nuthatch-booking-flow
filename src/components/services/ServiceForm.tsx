
import React from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceFormData } from '@/hooks/useServicesData';
import { ServiceBasicInfo } from './ServiceBasicInfo';
import { ServiceBookingSettings } from './ServiceBookingSettings';
import { ServiceAvailabilitySettings } from './ServiceAvailabilitySettings';
import { ServicePaymentSettings } from './ServicePaymentSettings';
import { ServiceAdvancedSettings } from './ServiceAdvancedSettings';

interface ServiceFormProps {
  formData: ServiceFormData;
  onFormDataChange: (updates: Partial<ServiceFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditing
}) => {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  // Get the service ID for booking windows - only available when editing
  const serviceIdForBookingWindows = isEditing ? (formData as any).id : null;

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="payments">Payments & Refunds</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <ServiceBasicInfo
            formData={formData}
            onFormDataChange={onFormDataChange}
          />
        </TabsContent>

        <TabsContent value="booking">
          <ServiceBookingSettings
            formData={formData}
            onFormDataChange={onFormDataChange}
          />
        </TabsContent>

        <TabsContent value="availability">
          <ServiceAvailabilitySettings
            serviceId={serviceIdForBookingWindows}
            isEditing={isEditing}
          />
        </TabsContent>

        <TabsContent value="payments">
          <ServicePaymentSettings
            formData={formData}
            onFormDataChange={onFormDataChange}
          />
        </TabsContent>

        <TabsContent value="advanced">
          <ServiceAdvancedSettings
            formData={formData}
            onFormDataChange={onFormDataChange}
          />
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (isEditing ? 'Update Service' : 'Create Service')}
        </Button>
      </div>
    </form>
  );
};
