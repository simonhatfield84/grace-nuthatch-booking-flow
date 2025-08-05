
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const WebhookConfiguration = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Configuration</CardTitle>
        <CardDescription>
          Webhook functionality has been simplified. Basic booking events are handled automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Webhook configuration is not available in this version.
        </p>
      </CardContent>
    </Card>
  );
};
