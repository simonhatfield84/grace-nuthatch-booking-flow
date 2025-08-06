
import { AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export const SecurityHardeningBanner = () => {
  return (
    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
      <Shield className="h-4 w-4 text-green-600" />
      <AlertDescription className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="text-green-800 dark:text-green-200">
          Security hardening applied successfully. Database functions have been updated with enhanced security measures.
        </span>
        <Badge variant="secondary" className="ml-2">
          Security Enhanced
        </Badge>
      </AlertDescription>
    </Alert>
  );
};
