
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ServiceRefundSettingsProps {
  refundWindowHours: number;
  autoRefundEnabled: boolean;
  onRefundWindowChange: (hours: number) => void;
  onAutoRefundChange: (enabled: boolean) => void;
}

export const ServiceRefundSettings = ({
  refundWindowHours,
  autoRefundEnabled,
  onRefundWindowChange,
  onAutoRefundChange
}: ServiceRefundSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Refund Settings
        </CardTitle>
        <CardDescription>
          Configure automatic refund policies for this service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="refund-window">Refund Window (Hours before booking)</Label>
          <Input
            id="refund-window"
            type="number"
            min="0"
            max="168"
            value={refundWindowHours}
            onChange={(e) => onRefundWindowChange(parseInt(e.target.value) || 24)}
          />
          <p className="text-sm text-muted-foreground">
            Guests can request refunds up to this many hours before their booking
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Automatic Refunds</Label>
            <p className="text-sm text-muted-foreground">
              Automatically process refunds for eligible cancellations
            </p>
          </div>
          <Switch
            checked={autoRefundEnabled}
            onCheckedChange={onAutoRefundChange}
          />
        </div>

        {autoRefundEnabled && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Refunds will be processed automatically for cancellations made within the refund window. 
              Manual approval may still be required for cancellations outside the window.
            </AlertDescription>
          </Alert>
        )}

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Make sure your Stripe account is configured to handle refunds. 
            Refund fees may apply depending on your Stripe plan.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
