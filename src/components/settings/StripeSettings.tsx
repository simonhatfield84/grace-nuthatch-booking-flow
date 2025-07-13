
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { useStripeSettings } from "@/hooks/useStripeSettings";

export const StripeSettings = () => {
  const { stripeSettings, isLoading, updateStripeSettings } = useStripeSettings();
  const [formData, setFormData] = useState({
    is_active: false,
    test_mode: true,
  });

  // Update form data when stripe settings are loaded
  useEffect(() => {
    if (stripeSettings) {
      console.log('Stripe settings loaded:', stripeSettings);
      setFormData({
        is_active: stripeSettings.is_active || false,
        test_mode: stripeSettings.test_mode ?? true,
      });
    }
  }, [stripeSettings]);

  const handleSave = async () => {
    console.log('Saving stripe settings:', formData);
    try {
      await updateStripeSettings.mutateAsync(formData);
    } catch (error) {
      console.error('Error saving stripe settings:', error);
    }
  };

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
          Configure Stripe connection for your venue. Payment rules are configured individually for each service.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Debug info */}
        <div className="bg-muted/50 p-3 rounded text-sm">
          <strong>Debug:</strong> Settings loaded: {stripeSettings ? 'Yes' : 'No'}, 
          Active: {formData.is_active ? 'Yes' : 'No'}, 
          Test Mode: {formData.test_mode ? 'Yes' : 'No'}
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div>
              <p className="font-medium">
                {isConfigured ? 'Stripe Connected' : 'Connect Stripe'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isConfigured 
                  ? 'Stripe is connected and ready to process payments'
                  : 'Connect your Stripe account to accept payments'
                }
              </p>
            </div>
          </div>
          {isConfigured && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
        </div>

        {/* Basic Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Stripe Payments</Label>
              <p className="text-sm text-muted-foreground">
                Allow your venue to accept payments through Stripe
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => {
                console.log('Toggling is_active to:', checked);
                setFormData(prev => ({ ...prev, is_active: checked }));
              }}
            />
          </div>

          {formData.is_active && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Test Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use Stripe test mode for development and testing
                </p>
              </div>
              <Switch
                checked={formData.test_mode}
                onCheckedChange={(checked) => {
                  console.log('Toggling test_mode to:', checked);
                  setFormData(prev => ({ ...prev, test_mode: checked }));
                }}
              />
            </div>
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

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Payment rules (when to charge, how much, etc.) are configured individually for each service in the Services section.
          </AlertDescription>
        </Alert>

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
