
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ExternalLink, CheckCircle, AlertCircle, Info, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface SetupWizardCardProps {
  environment: 'test' | 'live';
  isActive: boolean;
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
  hasWebhook: boolean;
  showOnlyWhenIncomplete?: boolean;
}

export const SetupWizardCard = ({ 
  environment, 
  isActive, 
  hasPublishableKey, 
  hasSecretKey, 
  hasWebhook,
  showOnlyWhenIncomplete = true
}: SetupWizardCardProps) => {
  const [showGuide, setShowGuide] = useState(false);

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
  const isComplete = completedSteps === totalSteps;

  if (!isActive) return null;

  // If showOnlyWhenIncomplete is true and setup is complete, show compact version
  if (showOnlyWhenIncomplete && isComplete) {
    return (
      <Collapsible open={showGuide} onOpenChange={setShowGuide}>
        <Card className="mb-6 border-green-200 bg-green-50/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-green-50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  {environment === 'test' ? 'Test Environment' : 'Live Environment'} - Ready
                  <Badge className="bg-green-100 text-green-800">Configured</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    {showGuide ? 'Hide Setup Guide' : 'Show Setup Guide'}
                  </Button>
                  {showGuide ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                  {getStepStatus(hasPublishableKey)}
                  <div className="flex-1">
                    <div className="font-medium">✓ Publishable Key Configured</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                  {getStepStatus(hasSecretKey)}
                  <div className="flex-1">
                    <div className="font-medium">✓ Secret Key Configured</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                  {getStepStatus(hasWebhook)}
                  <div className="flex-1">
                    <div className="font-medium">✓ Webhook Configured</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  // Show full setup guide when incomplete or when explicitly requested
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          {environment === 'test' ? 'Test Environment' : 'Live Environment'} Setup Guide
          <Badge variant={isComplete ? "default" : "secondary"}>
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

          {isComplete && (
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
