
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, AlertTriangle } from "lucide-react";

export const WebhookConfiguration = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Webhook Configuration
        </CardTitle>
        <CardDescription>
          Webhook configuration is now managed in the main Stripe settings above.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Configuration Moved:</strong> Webhook settings are now part of the enhanced Stripe configuration.
            Please use the tabs above to configure your webhook endpoints for both test and live environments.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
