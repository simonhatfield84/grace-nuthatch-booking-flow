
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, ChevronDown, ChevronRight, Info, Settings } from "lucide-react";
import { useState } from "react";

interface ConfigurationStatusCardProps {
  environment: 'test' | 'live';
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
  hasWebhook: boolean;
  isComplete: boolean;
}

export const ConfigurationStatusCard = ({ 
  environment, 
  hasPublishableKey, 
  hasSecretKey, 
  hasWebhook,
  isComplete 
}: ConfigurationStatusCardProps) => {
  const [isExpanded, setIsExpanded] = useState(!isComplete);

  const completedSteps = [hasPublishableKey, hasSecretKey, hasWebhook].filter(Boolean).length;
  const totalSteps = 3;

  if (isComplete) {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="mb-4 border-green-200 bg-green-50/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-green-50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  {environment === 'test' ? 'Test Environment' : 'Live Environment'} - Configured
                  <Badge className="bg-green-100 text-green-800">
                    Complete
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                  {isExpanded ? (
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
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Publishable Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Secret Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Webhook</span>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-orange-600" />
          {environment === 'test' ? 'Test Environment' : 'Live Environment'} Setup Required
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {completedSteps}/{totalSteps} Complete
          </Badge>
        </CardTitle>
      </CardHeader>
    </Card>
  );
};
