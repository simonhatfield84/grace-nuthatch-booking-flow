
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ServiceFormData } from '@/hooks/useServicesData';
import { DurationRules, DurationRule } from './DurationRules';

interface ServiceBookingSettingsProps {
  formData: ServiceFormData;
  onFormDataChange: (updates: Partial<ServiceFormData>) => void;
}

export const ServiceBookingSettings: React.FC<ServiceBookingSettingsProps> = ({
  formData,
  onFormDataChange
}) => {
  const handleDurationRulesChange = (rules: DurationRule[]) => {
    onFormDataChange({ duration_rules: rules });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min_guests">Minimum Guests</Label>
          <Input
            id="min_guests"
            type="number"
            min="1"
            value={formData.min_guests}
            onChange={(e) => onFormDataChange({ min_guests: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div>
          <Label htmlFor="max_guests">Maximum Guests</Label>
          <Input
            id="max_guests"
            type="number"
            min="1"
            value={formData.max_guests}
            onChange={(e) => onFormDataChange({ max_guests: parseInt(e.target.value) || 8 })}
          />
        </div>
      </div>

      <div>
        <Label>Duration Rules</Label>
        <DurationRules
          rules={formData.duration_rules || []}
          onChange={handleDurationRulesChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lead_time_hours">Lead Time (Hours)</Label>
          <Input
            id="lead_time_hours"
            type="number"
            min="0"
            value={formData.lead_time_hours}
            onChange={(e) => onFormDataChange({ lead_time_hours: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="cancellation_window_hours">Cancellation Window (Hours)</Label>
          <Input
            id="cancellation_window_hours"
            type="number"
            min="0"
            value={formData.cancellation_window_hours}
            onChange={(e) => onFormDataChange({ cancellation_window_hours: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Online Bookable</Label>
          <p className="text-sm text-muted-foreground">Allow customers to book online</p>
        </div>
        <Switch
          checked={formData.online_bookable}
          onCheckedChange={(checked) => onFormDataChange({ online_bookable: checked })}
        />
      </div>
    </div>
  );
};
