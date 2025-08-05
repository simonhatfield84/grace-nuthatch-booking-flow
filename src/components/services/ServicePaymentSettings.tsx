
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CreditCard, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ServicePaymentSettingsProps {
  service: {
    id: string;
    requires_payment: boolean;
    charge_type: string;
    charge_amount_per_guest: number;
    minimum_guests_for_charge: number;
  };
  onUpdate: (settings: {
    requires_payment: boolean;
    charge_type: string;
    charge_amount_per_guest: number;
    minimum_guests_for_charge: number;
  }) => void;
  isLoading?: boolean;
}

export const ServicePaymentSettings = ({ service, onUpdate, isLoading }: ServicePaymentSettingsProps) => {
  const [settings, setSettings] = useState({
    requires_payment: service.requires_payment || false,
    charge_type: service.charge_type || 'all_reservations',
    charge_amount_per_guest: service.charge_amount_per_guest || 0,
    minimum_guests_for_charge: service.minimum_guests_for_charge || 1,
  });

  const handleSave = () => {
    onUpdate(settings);
  };

  const hasChanges = 
    settings.requires_payment !== service.requires_payment ||
    settings.charge_type !== service.charge_type ||
    settings.charge_amount_per_guest !== service.charge_amount_per_guest ||
    settings.minimum_guests_for_charge !== service.minimum_guests_for_charge;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Settings
        </CardTitle>
        <CardDescription>
          Configure payment requirements for this service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require Payment</Label>
            <p className="text-sm text-muted-foreground">
              Enable payment collection for this service
            </p>
          </div>
          <Switch
            checked={settings.requires_payment}
            onCheckedChange={(checked) => 
              setSettings(prev => ({ ...prev, requires_payment: checked }))
            }
          />
        </div>

        {settings.requires_payment && (
          <>
            <div className="space-y-2">
              <Label>Charge Type</Label>
              <Select
                value={settings.charge_type}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, charge_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_reservations">All Reservations</SelectItem>
                  <SelectItem value="per_guest">Per Guest</SelectItem>
                  <SelectItem value="large_groups_only">Large Groups Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.charge_type === 'per_guest' && (
              <>
                <div className="space-y-2">
                  <Label>Charge Amount Per Guest (pence)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.charge_amount_per_guest}
                    onChange={(e) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        charge_amount_per_guest: parseInt(e.target.value) || 0 
                      }))
                    }
                    placeholder="e.g. 500 for £5.00"
                  />
                  <p className="text-sm text-muted-foreground">
                    Amount in pence (e.g., 500 = £5.00)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Guests for Charge</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.minimum_guests_for_charge}
                    onChange={(e) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        minimum_guests_for_charge: parseInt(e.target.value) || 1 
                      }))
                    }
                    placeholder="e.g. 8"
                  />
                  <p className="text-sm text-muted-foreground">
                    Only charge parties of this size or larger
                  </p>
                </div>
              </>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Make sure Stripe is configured in your venue settings before enabling payments.
                Guests will be charged at booking time for services requiring payment.
              </AlertDescription>
            </Alert>
          </>
        )}

        {hasChanges && (
          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Payment Settings'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
