
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertCircle, CheckCircle, ExternalLink, Eye, EyeOff, Copy } from "lucide-react";
import { useStripeSettings } from "@/hooks/useStripeSettings";
import { toast } from "sonner";

export const EnhancedStripeSettings = () => {
  const { stripeSettings, isLoading, updateStripeSettings } = useStripeSettings();
  const [activeTab, setActiveTab] = useState('test');
  const [showSecrets, setShowSecrets] = useState({
    test_webhook: false,
    live_webhook: false,
  });
  
  const [formData, setFormData] = useState({
    is_active: false,
    test_mode: true,
    publishable_key_test: '',
    publishable_key_live: '',
    webhook_secret_test: '',
    webhook_secret_live: '',
  });

  // Update form data when stripe settings are loaded
  useEffect(() => {
    if (stripeSettings) {
      setFormData({
        is_active: stripeSettings.is_active || false,
        test_mode: stripeSettings.test_mode ?? true,
        publishable_key_test: stripeSettings.publishable_key_test || '',
        publishable_key_live: stripeSettings.publishable_key_live || '',
        webhook_secret_test: stripeSettings.webhook_secret_test || '',
        webhook_secret_live: stripeSettings.webhook_secret_live || '',
      });
    }
  }, [stripeSettings]);

  const handleSave = async () => {
    console.log('Saving stripe settings:', formData);
    
    // Update configuration status based on filled fields
    const configuration_status = {
      test: {
        keys_configured: !!formData.publishable_key_test,
        webhook_configured: !!formData.webhook_secret_test,
      },
      live: {
        keys_configured: !!formData.publishable_key_live,
        webhook_configured: !!formData.webhook_secret_live,
      }
    };

    try {
      await updateStripeSettings.mutateAsync({
        ...formData,
        configuration_status,
      });
    } catch (error) {
      console.error('Error saving stripe settings:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const getWebhookUrl = (environment: 'test' | 'live') => {
    const baseUrl = environment === 'live' 
      ? 'https://grace-os.co.uk'  
      : 'https://wxyotttvyexxzeaewyga.supabase.co';
    return `${baseUrl}/functions/v1/stripe-webhook-secure`;
  };

  const getConfigurationStatus = (environment: 'test' | 'live') => {
    if (!stripeSettings?.configuration_status) return { keys: false, webhook: false };
    return {
      keys: stripeSettings.configuration_status[environment]?.keys_configured || false,
      webhook: stripeSettings.configuration_status[environment]?.webhook_configured || false,
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Payment Settings
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Payment Settings
          </CardTitle>
          <CardDescription>
            Configure Stripe for both test and live environments. Manage API keys and webhook configurations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Controls */}
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
                  setFormData(prev => ({ ...prev, is_active: checked }));
                }}
              />
            </div>

            {formData.is_active && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Use Test Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between test and live Stripe configurations
                  </p>
                </div>
                <Switch
                  checked={formData.test_mode}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ ...prev, test_mode: checked }));
                  }}
                />
              </div>
            )}
          </div>

          {formData.is_active && (
            <>
              {/* Environment Configuration */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="test" className="flex items-center gap-2">
                    Test Environment
                    <Badge variant={getConfigurationStatus('test').keys && getConfigurationStatus('test').webhook ? 'default' : 'secondary'} className="ml-1">
                      {getConfigurationStatus('test').keys && getConfigurationStatus('test').webhook ? 'Ready' : 'Incomplete'}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="live" className="flex items-center gap-2">
                    Live Environment
                    <Badge variant={getConfigurationStatus('live').keys && getConfigurationStatus('live').webhook ? 'default' : 'secondary'} className="ml-1">
                      {getConfigurationStatus('live').keys && getConfigurationStatus('live').webhook ? 'Ready' : 'Incomplete'}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="test" className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Test Environment Configuration</strong> - Use this for development and testing. 
                      This will work on both Lovable preview and your live domain.
                    </AlertDescription>
                  </Alert>

                  {/* Test API Keys */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="test-publishable">Test Publishable Key</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="test-publishable"
                          placeholder="pk_test_..."
                          value={formData.publishable_key_test}
                          onChange={(e) => setFormData(prev => ({ ...prev, publishable_key_test: e.target.value }))}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open('https://dashboard.stripe.com/test/apikeys', '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Find this in your Stripe Dashboard → Developers → API Keys (Test mode)
                      </p>
                    </div>

                    {/* Test Webhook Configuration */}
                    <div className="space-y-3">
                      <Label>Test Webhook Configuration</Label>
                      <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Webhook URL:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(getWebhookUrl('test'), 'Test webhook URL')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="font-mono text-xs bg-background p-2 rounded border">
                          {getWebhookUrl('test')}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Add this URL to your Stripe test webhooks with events: payment_intent.succeeded, payment_intent.payment_failed
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Label htmlFor="test-webhook-secret">Test Webhook Secret</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSecrets(prev => ({ ...prev, test_webhook: !prev.test_webhook }))}
                          >
                            {showSecrets.test_webhook ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                        <Input
                          id="test-webhook-secret"
                          type={showSecrets.test_webhook ? "text" : "password"}
                          placeholder="whsec_..."
                          value={formData.webhook_secret_test}
                          onChange={(e) => setFormData(prev => ({ ...prev, webhook_secret_test: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Get this from your webhook endpoint settings in Stripe Dashboard
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="live" className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Live Environment Configuration</strong> - Use this for production. 
                      Real payments will be processed. Only configure when ready for production use.
                    </AlertDescription>
                  </Alert>

                  {/* Live API Keys */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="live-publishable">Live Publishable Key</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="live-publishable"
                          placeholder="pk_live_..."
                          value={formData.publishable_key_live}
                          onChange={(e) => setFormData(prev => ({ ...prev, publishable_key_live: e.target.value }))}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open('https://dashboard.stripe.com/apikeys', '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Find this in your Stripe Dashboard → Developers → API Keys (Live mode)
                      </p>
                    </div>

                    {/* Live Webhook Configuration */}
                    <div className="space-y-3">
                      <Label>Live Webhook Configuration</Label>
                      <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Webhook URL:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(getWebhookUrl('live'), 'Live webhook URL')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="font-mono text-xs bg-background p-2 rounded border">
                          {getWebhookUrl('live')}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Add this URL to your Stripe live webhooks with events: payment_intent.succeeded, payment_intent.payment_failed
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Label htmlFor="live-webhook-secret">Live Webhook Secret</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSecrets(prev => ({ ...prev, live_webhook: !prev.live_webhook }))}
                          >
                            {showSecrets.live_webhook ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                        <Input
                          id="live-webhook-secret"
                          type={showSecrets.live_webhook ? "text" : "password"}
                          placeholder="whsec_..."
                          value={formData.webhook_secret_live}
                          onChange={(e) => setFormData(prev => ({ ...prev, webhook_secret_live: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Get this from your webhook endpoint settings in Stripe Dashboard
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Configuration Status */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Configuration Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Test Environment</span>
                      <div className="flex gap-2">
                        <Badge variant={getConfigurationStatus('test').keys ? 'default' : 'secondary'}>
                          {getConfigurationStatus('test').keys ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                          API Keys
                        </Badge>
                        <Badge variant={getConfigurationStatus('test').webhook ? 'default' : 'secondary'}>
                          {getConfigurationStatus('test').webhook ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                          Webhook
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Live Environment</span>
                      <div className="flex gap-2">
                        <Badge variant={getConfigurationStatus('live').keys ? 'default' : 'secondary'}>
                          {getConfigurationStatus('live').keys ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                          API Keys
                        </Badge>
                        <Badge variant={getConfigurationStatus('live').webhook ? 'default' : 'secondary'}>
                          {getConfigurationStatus('live').webhook ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                          Webhook
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Secret Keys:</strong> Your Stripe secret keys are stored securely in Supabase Edge Function secrets. 
              You'll need to configure these separately in your Supabase project settings.
              <br />
              <strong>Environment Management:</strong> The system will automatically use the correct keys based on your test mode setting.
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
    </div>
  );
};
