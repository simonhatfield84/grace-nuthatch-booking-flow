
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { useStripeSettings } from "@/hooks/useStripeSettings";

export const StripeSettings = () => {
  const { stripeSettings, isLoading, updateStripeSettings } = useStripeSettings();
  const [formData, setFormData] = useState({
    is_active: stripeSettings?.is_active || false,
    charge_type: (stripeSettings?.charge_type || 'none') as 'none' | 'all_reservations' | 'large_groups',
    minimum_guests_for_charge: stripeSettings?.minimum_guests_for_charge || 8,
    charge_amount_per_guest: stripeSettings?.charge_amount_per_guest || 0,
    test_mode: stripeSettings?.test_mode ?? true,
  });

  const handleSave = () => {
    updateStripeSettings.mutate(formData);
  };

  const chargeAmountInPounds = formData.charge_amount_per_guest / 100;
  const isConfigured = stripeSettings?.is_active || false;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Settings
        </CardTitle>
        <CardDescription>
          Configure Stripe payments for your reservations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div>
              <p className="font-medium">
                {isConfigured ? 'Stripe Configured' : 'Configure Stripe'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isConfigured 
                  ? 'Stripe is configured and ready to process payments'
                  : 'Configure your payment settings to start accepting payments'
                }
              </p>
            </div>
          </div>
          {isConfigured && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
        </div>

        {/* Payment Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Payments</Label>
              <p className="text-sm text-muted-foreground">
                Accept payments for reservations
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_active: checked }))
              }
            />
          </div>

          {formData.is_active && (
            <>
              <div className="space-y-2">
                <Label>When to Charge</Label>
                <Select
                  value={formData.charge_type}
                  onValueChange={(value: 'none' | 'all_reservations' | 'large_groups') =>
                    setFormData(prev => ({ ...prev, charge_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Don't charge</SelectItem>
                    <SelectItem value="all_reservations">All reservations</SelectItem>
                    <SelectItem value="large_groups">Large groups only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.charge_type === 'large_groups' && (
                <div className="space-y-2">
                  <Label>Minimum Guests for Charge</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.minimum_guests_for_charge}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        minimum_guests_for_charge: parseInt(e.target.value) || 8
                      }))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Charge groups of this size or larger
                  </p>
                </div>
              )}

              {formData.charge_type !== 'none' && (
                <div className="space-y-2">
                  <Label>Charge Amount per Guest</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={chargeAmountInPounds}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          charge_amount_per_guest: Math.round(parseFloat(e.target.value || '0') * 100)
                        }))
                      }
                      className="pl-8"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Amount to charge per person
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Test Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use Stripe test mode for development
                  </p>
                </div>
                <Switch
                  checked={formData.test_mode}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, test_mode: checked }))
                  }
                />
              </div>
            </>
          )}
        </div>

        {/* Information Alerts */}
        {formData.test_mode && formData.is_active && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Test mode is enabled. No real payments will be processed. Use test card numbers for testing.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updateStripeSettings.isPending}
          >
            {updateStripeSettings.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
