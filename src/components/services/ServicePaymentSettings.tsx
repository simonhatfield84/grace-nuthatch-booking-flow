
import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";

interface PaymentSettings {
  requires_payment: boolean;
  charge_type: 'all_reservations' | 'large_groups';
  minimum_guests_for_charge: number;
  charge_amount_per_guest: number;
}

interface ServicePaymentSettingsProps {
  paymentSettings: PaymentSettings;
  onPaymentSettingsChange: (settings: PaymentSettings) => void;
}

export const ServicePaymentSettings = ({
  paymentSettings,
  onPaymentSettingsChange
}: ServicePaymentSettingsProps) => {
  const updateSetting = (key: keyof PaymentSettings, value: any) => {
    onPaymentSettingsChange({
      ...paymentSettings,
      [key]: value
    });
  };

  return (
    <TabsContent value="payments" className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require Payment</Label>
            <p className="text-sm text-muted-foreground">
              Charge customers when they book this service
            </p>
          </div>
          <Switch
            checked={paymentSettings.requires_payment}
            onCheckedChange={(checked) => updateSetting('requires_payment', checked)}
          />
        </div>

        {paymentSettings.requires_payment && (
          <>
            <div className="space-y-2">
              <Label>Payment Rule</Label>
              <Select
                value={paymentSettings.charge_type}
                onValueChange={(value: 'all_reservations' | 'large_groups') =>
                  updateSetting('charge_type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_reservations">All reservations</SelectItem>
                  <SelectItem value="large_groups">Large groups only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentSettings.charge_type === 'large_groups' && (
              <div className="space-y-2">
                <Label>Minimum Guests for Charge</Label>
                <Input
                  type="number"
                  min="1"
                  value={paymentSettings.minimum_guests_for_charge}
                  onChange={(e) =>
                    updateSetting('minimum_guests_for_charge', parseInt(e.target.value) || 8)
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Charge Amount per Guest</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentSettings.charge_amount_per_guest / 100}
                  onChange={(e) =>
                    updateSetting('charge_amount_per_guest', Math.round(parseFloat(e.target.value || '0') * 100))
                  }
                  className="pl-8"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </TabsContent>
  );
};
