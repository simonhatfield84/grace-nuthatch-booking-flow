
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ServiceFormData } from '@/hooks/useServicesData';

interface ServiceRefundSettingsProps {
  formData: ServiceFormData;
  onFormDataChange: (updates: Partial<ServiceFormData>) => void;
}

export const ServiceRefundSettings: React.FC<ServiceRefundSettingsProps> = ({
  formData,
  onFormDataChange
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="refund_window_hours">Refund Window (Hours)</Label>
        <Input
          id="refund_window_hours"
          type="number"
          min="0"
          value={formData.refund_window_hours}
          onChange={(e) => onFormDataChange({ refund_window_hours: parseInt(e.target.value) || 24 })}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Customers can cancel and receive automatic refunds up to this many hours before their booking
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Automatic Refunds</Label>
          <p className="text-sm text-muted-foreground">Process refunds automatically when within the window</p>
        </div>
        <Switch
          checked={formData.auto_refund_enabled}
          onCheckedChange={(checked) => onFormDataChange({ auto_refund_enabled: checked })}
        />
      </div>

      <div>
        <Label htmlFor="refund_policy_text">Refund Policy Description</Label>
        <Textarea
          id="refund_policy_text"
          value={formData.refund_policy_text || ''}
          onChange={(e) => onFormDataChange({ refund_policy_text: e.target.value })}
          placeholder="Describe your refund policy for customers..."
          rows={3}
        />
        <p className="text-sm text-muted-foreground mt-1">
          This text will be shown to customers during the booking process
        </p>
      </div>
    </div>
  );
};
