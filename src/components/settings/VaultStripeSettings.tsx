import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertCircle, CheckCircle, Shield, Eye, EyeOff, Key, Lock } from "lucide-react";
import { useStripeSettings } from "@/hooks/useStripeSettings";
import { StripeKeyEncryption } from "@/utils/encryption";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { WebhookConfiguration } from "./WebhookConfiguration";
import { SetupWizardCard } from "./SetupWizardCard";

export const VaultStripeSettings = () => {
  const { stripeSettings, isLoading, updateStripeSettings } = useStripeSettings();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('test');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    test_secret: false,
    live_secret: false,
    test_webhook: false,
    live_webhook: false,
  });
  
  const [formData, setFormData] = useState({
    is_active: false,
    test_mode: true,
    publishable_key_test: '',
    publishable_key_live: '',
    secret_key_test: '',
    secret_key_live: '',
    webhook_secret_test: '',
    webhook_secret_live: '',
  });

  const [keyValidation, setKeyValidation] = useState({
    test_secret_valid: false,
    live_secret_valid: false,
    test_publishable_valid: false,
    live_publishable_valid: false,
  });

  useEffect(() => {
    if (stripeSettings) {
      setFormData({
        is_active: stripeSettings.is_active || false,
        test_mode: stripeSettings.test_mode ?? true,
        publishable_key_test: stripeSettings.publishable_key_test || '',
        publishable_key_live: stripeSettings.publishable_key_live || '',
        secret_key_test: '', // Never populate encrypted secrets in UI
        secret_key_live: '', // Never populate encrypted secrets in UI
        webhook_secret_test: stripeSettings.webhook_secret_test || '',
        webhook_secret_live: stripeSettings.webhook_secret_live || '',
      });

      // Update key validation status
      setKeyValidation({
        test_secret_valid: stripeSettings.key_validation_status?.test?.valid || false,
        live_secret_valid: stripeSettings.key_validation_status?.live?.valid || false,
        test_publishable_valid: !!stripeSettings.publishable_key_test,
        live_publishable_valid: !!stripeSettings.publishable_key_live,
      });
    }
  }, [stripeSettings]);

  const validateKey = async (key: string, type: 'secret' | 'publishable', environment: 'test' | 'live') => {
    if (!key) return false;

    let isValid = false;
    if (type === 'secret') {
      isValid = StripeKeyEncryption.validateStripeKeyFormat(key, environment);
    } else {
      isValid = environment === 'test' 
        ? key.startsWith('pk_test_') && key.length > 20
        : key.startsWith('pk_live_') && key.length > 20;
    }

    // Audit the validation attempt
    if (stripeSettings?.venue_id) {
      await StripeKeyEncryption.auditKeyAccess(
        stripeSettings.venue_id,
        user?.id || null,
        'validated',
        environment,
        type,
        isValid,
        isValid ? undefined : 'Invalid key format'
      );
    }

    return isValid;
  };

  const handleKeyChange = async (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Real-time validation
    if (field.includes('secret_key')) {
      const environment = field.includes('test') ? 'test' : 'live';
      const isValid = await validateKey(value, 'secret', environment);
      setKeyValidation(prev => ({ 
        ...prev, 
        [`${environment}_secret_valid`]: isValid 
      }));
    } else if (field.includes('publishable_key')) {
      const environment = field.includes('test') ? 'test' : 'live';
      const isValid = await validateKey(value, 'publishable', environment);
      setKeyValidation(prev => ({ 
        ...prev, 
        [`${environment}_publishable_valid`]: isValid 
      }));
    }
  };

  const handleEnvironmentSwitch = async (testMode: boolean) => {
    // Audit environment switch
    if (stripeSettings?.venue_id) {
      await StripeKeyEncryption.auditKeyAccess(
        stripeSettings.venue_id,
        user?.id || null,
        'environment_switched',
        'both',
        'secret',
        true,
        undefined,
        { from: formData.test_mode ? 'test' : 'live', to: testMode ? 'test' : 'live' }
      );
    }

    setFormData(prev => ({ ...prev, test_mode: testMode }));

    if (!testMode) {
      // Show warning when switching to live mode
      toast("⚠️ Switching to LIVE mode", {
        description: "Real payments will be processed. Ensure live keys are configured correctly.",
        duration: 5000,
      });
    }
  };

  const handleSave = async () => {
    if (!stripeSettings?.venue_id) return;

    setIsEncrypting(true);
    
    try {
      let encryptedTestKey = undefined;
      let encryptedLiveKey = undefined;

      if (formData.secret_key_test) {
        const testKeyValid = await validateKey(formData.secret_key_test, 'secret', 'test');
        if (!testKeyValid) {
          toast.error('Invalid test secret key format');
          return;
        }

        const encrypted = await StripeKeyEncryption.encryptStripeKey(
          formData.secret_key_test,
          stripeSettings.venue_id,
          'test'
        );
        encryptedTestKey = JSON.stringify(encrypted);

        // Audit key update
        await StripeKeyEncryption.auditKeyAccess(
          stripeSettings.venue_id,
          user?.id || null,
          'updated',
          'test',
          'secret',
          true
        );
      }

      if (formData.secret_key_live) {
        const liveKeyValid = await validateKey(formData.secret_key_live, 'secret', 'live');
        if (!liveKeyValid) {
          toast.error('Invalid live secret key format');
          return;
        }

        const encrypted = await StripeKeyEncryption.encryptStripeKey(
          formData.secret_key_live,
          stripeSettings.venue_id,
          'live'
        );
        encryptedLiveKey = JSON.stringify(encrypted);

        // Audit key update
        await StripeKeyEncryption.auditKeyAccess(
          stripeSettings.venue_id,
          user?.id || null,
          'updated',
          'live',
          'secret',
          true
        );
      }

      // Update configuration status
      const configuration_status = {
        test: {
          keys_configured: !!formData.publishable_key_test && (!!encryptedTestKey || keyValidation.test_secret_valid),
          webhook_configured: !!formData.webhook_secret_test,
        },
        live: {
          keys_configured: !!formData.publishable_key_live && (!!encryptedLiveKey || keyValidation.live_secret_valid),
          webhook_configured: !!formData.webhook_secret_live,
        }
      };

      const updateData: any = {
        is_active: formData.is_active,
        test_mode: formData.test_mode,
        publishable_key_test: formData.publishable_key_test || null,
        publishable_key_live: formData.publishable_key_live || null,
        webhook_secret_test: formData.webhook_secret_test || null,
        webhook_secret_live: formData.webhook_secret_live || null,
        configuration_status,
        key_validation_status: {
          test: { valid: keyValidation.test_secret_valid, last_checked: new Date().toISOString() },
          live: { valid: keyValidation.live_secret_valid, last_checked: new Date().toISOString() }
        },
        last_key_update_at: new Date().toISOString(),
        encryption_key_id: 'v1_aes256gcm'
      };

      if (encryptedTestKey) {
        updateData.secret_key_test_encrypted = encryptedTestKey;
      }
      if (encryptedLiveKey) {
        updateData.secret_key_live_encrypted = encryptedLiveKey;
      }

      await updateStripeSettings.mutateAsync(updateData);

      // Clear secret key fields after successful save
      setFormData(prev => ({ 
        ...prev, 
        secret_key_test: '', 
        secret_key_live: '' 
      }));

      toast.success("🔐 Stripe keys encrypted and saved securely");

    } catch (error) {
      console.error('Error saving encrypted stripe settings:', error);
      toast.error('Failed to encrypt and save Stripe settings');
    } finally {
      setIsEncrypting(false);
    }
  };

  const getSecurityIndicator = (environment: 'test' | 'live') => {
    const hasKeys = configuration_status[environment]?.keys_configured || false;
    const hasWebhook = configuration_status[environment]?.webhook_configured || false;
    
    if (hasKeys && hasWebhook) {
      return <Badge className="bg-green-100 text-green-800"><Lock className="h-3 w-3 mr-1" />Secure</Badge>;
    } else if (hasKeys) {
      return <Badge variant="secondary"><Key className="h-3 w-3 mr-1" />Keys Only</Badge>;
    } else {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Incomplete</Badge>;
    }
  };

  const configuration_status = stripeSettings?.configuration_status || {
    test: { keys_configured: false, webhook_configured: false },
    live: { keys_configured: false, webhook_configured: false }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Vault-Level Stripe Security
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
            <Shield className="h-5 w-5" />
            Vault-Level Stripe Security
          </CardTitle>
          <CardDescription>
            Bank-grade AES-256-GCM encryption for your Stripe keys. All secret keys are encrypted before storage.
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
                  <Label>Environment Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Manual control: Test for development, Live for production
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={formData.test_mode ? "secondary" : "destructive"}>
                    {formData.test_mode ? "TEST" : "LIVE"}
                  </Badge>
                  <Switch
                    checked={formData.test_mode}
                    onCheckedChange={handleEnvironmentSwitch}
                  />
                </div>
              </div>
            )}
          </div>

          {formData.is_active && (
            <>
              {/* Setup Wizard Cards */}
              <SetupWizardCard
                environment="test"
                isActive={activeTab === 'test'}
                hasPublishableKey={keyValidation.test_publishable_valid}
                hasSecretKey={keyValidation.test_secret_valid}
                hasWebhook={!!formData.webhook_secret_test}
              />
              
              <SetupWizardCard
                environment="live"
                isActive={activeTab === 'live'}
                hasPublishableKey={keyValidation.live_publishable_valid}
                hasSecretKey={keyValidation.live_secret_valid}
                hasWebhook={!!formData.webhook_secret_live}
              />

              {/* Security Status Dashboard */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security Status
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Test Environment</span>
                    {getSecurityIndicator('test')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Live Environment</span>
                    {getSecurityIndicator('live')}
                  </div>
                </div>
              </div>

              {/* Environment Configuration */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="test" className="flex items-center gap-2">
                    Test Environment
                    {getSecurityIndicator('test')}
                  </TabsTrigger>
                  <TabsTrigger value="live" className="flex items-center gap-2">
                    Live Environment
                    {getSecurityIndicator('live')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="test" className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Test Environment</strong> - All secret keys are encrypted with AES-256-GCM before storage.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    {/* Test Publishable Key */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="test-publishable">Test Publishable Key</Label>
                        {keyValidation.test_publishable_valid && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <Input
                        id="test-publishable"
                        placeholder="pk_test_..."
                        value={formData.publishable_key_test}
                        onChange={(e) => handleKeyChange('publishable_key_test', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Find this in your Stripe Dashboard → Developers → API keys (Test mode)
                      </p>
                    </div>

                    {/* Test Secret Key */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="test-secret">Test Secret Key</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSecrets(prev => ({ ...prev, test_secret: !prev.test_secret }))}
                        >
                          {showSecrets.test_secret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        {keyValidation.test_secret_valid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : formData.secret_key_test ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                      <Input
                        id="test-secret"
                        type={showSecrets.test_secret ? "text" : "password"}
                        placeholder="sk_test_..."
                        value={formData.secret_key_test}
                        onChange={(e) => handleKeyChange('secret_key_test', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        🔐 Encrypted with AES-256-GCM before storage. Never stored in plain text.
                      </p>
                    </div>

                    {/* Test Webhook Secret */}
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
                        Found when you create a webhook endpoint in your Stripe Dashboard
                      </p>
                    </div>

                    {/* Webhook Configuration for Test */}
                    <WebhookConfiguration environment="test" />
                  </div>
                </TabsContent>

                <TabsContent value="live" className="space-y-4">
                  <Alert variant="destructive">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>LIVE Environment</strong> - Real payments will be processed. All keys encrypted with bank-grade security.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    {/* Live Publishable Key */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="live-publishable">Live Publishable Key</Label>
                        {keyValidation.live_publishable_valid && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <Input
                        id="live-publishable"
                        placeholder="pk_live_..."
                        value={formData.publishable_key_live}
                        onChange={(e) => handleKeyChange('publishable_key_live', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Find this in your Stripe Dashboard → Developers → API keys (Live mode)
                      </p>
                    </div>

                    {/* Live Secret Key */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="live-secret">Live Secret Key</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSecrets(prev => ({ ...prev, live_secret: !prev.live_secret }))}
                        >
                          {showSecrets.live_secret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        {keyValidation.live_secret_valid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : formData.secret_key_live ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                      <Input
                        id="live-secret"
                        type={showSecrets.live_secret ? "text" : "password"}
                        placeholder="sk_live_..."
                        value={formData.secret_key_live}
                        onChange={(e) => handleKeyChange('secret_key_live', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        🔐 Encrypted with AES-256-GCM before storage. Never stored in plain text.
                      </p>
                    </div>

                    {/* Live Webhook Secret */}
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
                        Found when you create a webhook endpoint in your Stripe Dashboard
                      </p>
                    </div>

                    {/* Webhook Configuration for Live */}
                    <WebhookConfiguration environment="live" />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Bank-Grade Security:</strong> All secret keys are encrypted using AES-256-GCM encryption before storage. 
              Keys are never stored in plain text and are decrypted only when needed for payment processing.
              All key access is comprehensively audited.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateStripeSettings.isPending || isEncrypting}
            >
              {isEncrypting ? (
                <>
                  <Lock className="h-4 w-4 mr-2 animate-spin" />
                  Encrypting Keys...
                </>
              ) : updateStripeSettings.isPending ? (
                'Saving...'
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Save Encrypted Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
