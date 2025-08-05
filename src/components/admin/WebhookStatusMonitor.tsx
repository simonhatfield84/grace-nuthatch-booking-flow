
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Webhook, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface WebhookTestResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  timestamp: Date;
}

export const WebhookStatusMonitor = () => {
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { data: recentFailures, refetch } = useQuery({
    queryKey: ['recent-webhook-failures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_audit')
        .select('*')
        .eq('event_type', 'webhook_received')
        .eq('event_details->verified', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  const testWebhookConnectivity = async () => {
    setIsTesting(true);
    
    try {
      // Test if the webhook endpoint is accessible
      const response = await fetch('https://wxyotttvyexxzeaewyga.supabase.co/functions/v1/stripe-webhook-secure', {
        method: 'OPTIONS',
      });

      setTestResult({
        success: response.ok,
        statusCode: response.status,
        timestamp: new Date()
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message,
        timestamp: new Date()
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getWebhookStatus = () => {
    if (recentFailures && recentFailures.length > 0) {
      return { status: 'error', message: `${recentFailures.length} webhook failures in last 24h` };
    }
    if (testResult?.success) {
      return { status: 'success', message: 'Webhook endpoint accessible' };
    }
    if (testResult && !testResult.success) {
      return { status: 'error', message: 'Webhook endpoint failed test' };
    }
    return { status: 'warning', message: 'Status unknown - test connectivity' };
  };

  const status = getWebhookStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhook Status Monitor
        </CardTitle>
        <CardDescription>
          Monitor Stripe webhook connectivity and recent failures
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status.status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
            {status.status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
            <span className="font-medium">{status.message}</span>
          </div>
          <Badge variant={
            status.status === 'success' ? 'default' : 
            status.status === 'warning' ? 'secondary' : 
            'destructive'
          }>
            {status.status.toUpperCase()}
          </Badge>
        </div>

        {status.status === 'error' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Critical:</strong> Webhook failures detected. Bookings may not be confirmed automatically. 
              Use manual reconciliation for affected bookings.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={testWebhookConnectivity} 
            disabled={isTesting}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
            Test Connectivity
          </Button>
          <Button onClick={() => refetch()} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          <Button 
            onClick={() => window.open('https://supabase.com/dashboard/project/wxyotttvyexxzeaewyga/functions/stripe-webhook-secure/logs', '_blank')}
            size="sm"
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            View Logs
          </Button>
        </div>

        {testResult && (
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Last Test Result</h4>
            <div className="text-sm space-y-1">
              <p><strong>Status:</strong> {testResult.success ? 'Success' : 'Failed'}</p>
              {testResult.statusCode && <p><strong>Status Code:</strong> {testResult.statusCode}</p>}
              {testResult.error && <p><strong>Error:</strong> {testResult.error}</p>}
              <p><strong>Tested:</strong> {testResult.timestamp.toLocaleString()}</p>
            </div>
          </div>
        )}

        {recentFailures && recentFailures.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Recent Webhook Failures</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {recentFailures.map((failure) => (
                <div key={failure.id} className="text-xs p-2 bg-red-50 rounded">
                  <span className="font-medium">{new Date(failure.created_at).toLocaleString()}</span>
                  <span className="ml-2 text-muted-foreground">
                    {failure.event_details?.error || 'Authentication failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
