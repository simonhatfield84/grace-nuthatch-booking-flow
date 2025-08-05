
import React from 'react';
import { InlineBookingWindowManager } from './InlineBookingWindowManager';

interface ServiceAvailabilitySettingsProps {
  serviceId: string | null;
  isEditing: boolean;
}

export const ServiceAvailabilitySettings: React.FC<ServiceAvailabilitySettingsProps> = ({
  serviceId,
  isEditing
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Booking Availability</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure when this service is available for booking by setting up booking windows with specific days, times, and capacity limits.
        </p>
      </div>
      
      {serviceId && isEditing ? (
        <InlineBookingWindowManager serviceId={serviceId} />
      ) : (
        <div className="border rounded-lg p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Save the service first to configure booking availability windows.
          </p>
          <p className="text-sm text-muted-foreground">
            You'll be able to set specific days, times, and booking limits after creating the service.
          </p>
        </div>
      )}
    </div>
  );
};
