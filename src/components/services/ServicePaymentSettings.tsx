
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CreditCard, RefreshCw } from "lucide-react";
import { ServiceFormData } from '@/hooks/useServicesData';

interface ServicePaymentSettingsProps {
  formData: ServiceFormData;
  onFormDataChange: (updates: Partial<ServiceFormData>) => void;
}

export const ServicePaymentSettings: React.FC<ServicePaymentSettingsProps> = ({
  formData,
  onFormDataChange
}) => {
  const [displayAmount, setDisplayAmount] = useState<string>('');

  useEffect(() => {
    if (formData.charge_amount_per_guest === 0) {
      setDisplayAmount('');
    } else {
      setDisplayAmount((formData.charge_amount_per_guest / 100).toFixed(2));
    }
  }, [formData.charge_amount_per_guest]);

  const handlePaymentAmountChange = (value: string) => {
    setDisplayAmount(value);
    
    const poundValue = parseFloat(value) || 0;
    const penceValue = Math.round(poundValue * 100);
    onFormDataChange({ charge_amount_per_guest: penceValue });
  };

  return (
    <div className="space-y-6">
      {/* Payment Settings Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Payment Settings</h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Require Payment</Label>
            <p className="text-sm text-muted-foreground">Charge customers when they book</p>
          </div>
          <Switch
            checked={formData.requires_payment}
            onCheckedChange={(checked) => {
              onFormDataChange({ 
                requires_payment: checked,
                charge_type: checked ? 'all_reservations' : 'none'
              });
            }}
          />
        </div>

        {formData.requires_payment && (
          <div className="space-y-4 pl-4 border-l-2 border-muted">
            <div>
              <Label>Payment Rule</Label>
              <Select
                value={formData.charge_type}
                onValueChange={(value: 'all_reservations' | 'large_groups' | 'venue_default') => {
                  onFormDataChange({ charge_type: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_reservations">All reservations</SelectItem>
                  <SelectItem value="large_groups">Large groups only</SelectItem>
                  <SelectItem value="venue_default">Use venue default</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.charge_type === 'large_groups' && (
              <div>
                <Label htmlFor="minimum_guests_for_charge">Minimum Guests for Charge</Label>
                <Input
                  id="minimum_guests_for_charge"
                  type="number"
                  min="1"
                  value={formData.minimum_guests_for_charge}
                  onChange={(e) =>
                    onFormDataChange({ minimum_guests_for_charge: parseInt(e.target.value) || 8 })
                  }
                />
              </div>
            )}

            <div>
              <Label htmlFor="charge_amount_per_guest">Charge Amount per Guest</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10">
                  £
                </span>
                <Input
                  id="charge_amount_per_guest"
                  type="text"
                  className="pl-8"
                  placeholder="29.95"
                  value={displayAmount}
                  onChange={(e) => handlePaymentAmountChange(e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the amount in pounds (e.g., 29.95 for £29.95)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Refund Policy Section - Only show when payments are enabled */}
      {formData.requires_payment && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded px-2 -mx-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Refund Policy</h3>
            </div>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="refund_window_hours">Refund Window (Hours before booking)</Label>
              <Input
                id="refund_window_hours"
                type="number"
                min="0"
                max="168"
                value={formData.refund_window_hours || 24}
                onChange={(e) => onFormDataChange({ refund_window_hours: parseInt(e.target.value) || 24 })}
              />
              <p className="text-sm text-muted-foreground">
                Guests can request refunds up to this many hours before their booking
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Automatic Refunds</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically process refunds for eligible cancellations
                </p>
              </div>
              <Switch
                checked={formData.auto_refund_enabled || false}
                onCheckedChange={(checked) => onFormDataChange({ auto_refund_enabled: checked })}
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
              <p><strong>Note:</strong> Make sure your Stripe account is configured to handle refunds. Refund fees may apply depending on your Stripe plan.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
