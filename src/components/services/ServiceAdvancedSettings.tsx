
import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ServiceFormData } from '@/hooks/useServicesData';

interface ServiceAdvancedSettingsProps {
  formData: ServiceFormData;
  onFormDataChange: (updates: Partial<ServiceFormData>) => void;
}

export const ServiceAdvancedSettings: React.FC<ServiceAdvancedSettingsProps> = ({
  formData,
  onFormDataChange
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Active</Label>
          <p className="text-sm text-muted-foreground">Service is available for booking</p>
        </div>
        <Switch
          checked={formData.active}
          onCheckedChange={(checked) => onFormDataChange({ active: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Secret Service</Label>
          <p className="text-sm text-muted-foreground">Only accessible via a secret link</p>
        </div>
        <Switch
          checked={formData.is_secret}
          onCheckedChange={(checked) => onFormDataChange({ is_secret: checked })}
        />
      </div>

      {formData.is_secret && (
        <div>
          <Label htmlFor="secret_slug">Secret Slug</Label>
          <Input
            id="secret_slug"
            value={formData.secret_slug}
            onChange={(e) => onFormDataChange({ secret_slug: e.target.value })}
            placeholder="secret-link-name"
          />
        </div>
      )}

      <div>
        <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
        <Textarea
          id="terms_and_conditions"
          value={formData.terms_and_conditions}
          onChange={(e) => onFormDataChange({ terms_and_conditions: e.target.value })}
          rows={6}
        />
      </div>
    </div>
  );
};
