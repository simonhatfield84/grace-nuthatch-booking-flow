
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, AlertCircle, Info } from "lucide-react";

interface SetupWizardCardProps {
  environment: 'test' | 'live';
  isActive: boolean;
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
  hasWebhook: boolean;
}

export const SetupWizardCard = ({ 
  environment, 
  isActive, 
  hasPublishableKey, 
  hasSecretKey, 
  hasWebhook 
}: SetupWizardCardProps) => {
  const openStripeKeysPage = () => {
    const url = environment === 'live' 
      ? 'https://dashboard.stripe.com/apikeys'
      : 'https://dashboard.stripe.com/test/apikeys';
    window.open(url, '_blank');
  };

  const openWebhookPage = () => {
    const url = environment === 'live' 
      ? 'https://dashboard.stripe.com/webhooks'
      : 'https://dashboard.stripe.com/test/webhooks';
    window.open(url, '_blank');
  };

  const getStepStatus = (completed: boolean) => {
    return completed ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-orange-500" />
    );
  };

  const completedSteps = [hasPublishableKey, hasSecretKey, hasWebhook].filter(Boolean).length;
  const totalSteps = 3;

  if (!isActive) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          {environment === 'test' ? 'Test Environment' : 'Live Environment'} Setup Guide
          <Badge variant={completedSteps === totalSteps ? "default" : "secondary"}>
            {completedSteps}/{totalSteps} Complete
          </Badge>
        </CardTitle>
        <CardDescription>
          {environment === 'test' 
            ? 'Configure test keys for development and testing' 
            : 'Configure live keys for production payments (real money)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {environment === 'live' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Live Environment:</strong> These keys process real payments. Only use when ready for production.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              {getStepStatus(hasPublishableKey)}
              <div className="flex-1">
                <div className="font-medium">1. Add Publishable Key</div>
                <div className="text-sm text-muted-foreground">
                  Starts with <code>pk_{environment}_</code> - This is safe to expose in your frontend
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={openStripeKeysPage}>
                <ExternalLink className="h-3 w-3 mr-1" />
                Get Key
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              {getStepStatus(hasSecretKey)}
              <div className="flex-1">
                <div className="font-medium">2. Add Secret Key (Encrypted)</div>
                <div className="text-sm text-muted-foreground">
                  Starts with <code>sk_{environment}_</code> - Encrypted with AES-256-GCM before storage
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={openStripeKeysPage}>
                <ExternalLink className="h-3 w-3 mr-1" />
                Get Key
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              {getStepStatus(hasWebhook)}
              <div className="flex-1">
                <div className="font-medium">3. Configure Webhook</div>
                <div className="text-sm text-muted-foreground">
                  Set up webhook endpoint to receive payment notifications
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={openWebhookPage}>
                <ExternalLink className="h-3 w-3 mr-1" />
                Configure
              </Button>
            </div>
          </div>

          {completedSteps === totalSteps && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Setup Complete!</strong> Your {environment} environment is fully configured and ready to process payments.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
