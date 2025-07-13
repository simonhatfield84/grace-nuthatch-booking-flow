
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Users } from "lucide-react";

interface Conflict {
  type: 'table_occupied' | 'double_booking' | 'capacity_exceeded';
  message: string;
  severity: 'high' | 'medium' | 'low';
  suggestions: string[];
}

interface ConflictResolutionProps {
  conflicts: Conflict[];
  walkInData: any;
  onResolve: (resolution: any) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function ConflictResolution({ 
  conflicts, 
  walkInData, 
  onResolve, 
  onBack, 
  isLoading 
}: ConflictResolutionProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAutoResolve = () => {
    // Implement auto-resolution logic
    onResolve({ type: 'auto', conflicts });
  };

  const handleManualResolve = (conflict: Conflict, solution: string) => {
    onResolve({ type: 'manual', conflict, solution });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-orange-600">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Conflicts Detected</h3>
      </div>

      <div className="space-y-3">
        {conflicts.map((conflict, index) => (
          <Card key={index} className="border-l-4 border-l-orange-400">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{conflict.message}</CardTitle>
                <Badge className={getSeverityColor(conflict.severity)}>
                  {conflict.severity.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Suggested solutions:</p>
                <ul className="text-sm space-y-1">
                  {conflict.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-gray-400">•</span>
                      <span>{suggestion}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManualResolve(conflict, suggestion)}
                        disabled={isLoading}
                      >
                        Apply
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between space-x-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="space-x-2">
          <Button 
            variant="secondary" 
            onClick={handleAutoResolve}
            disabled={isLoading}
          >
            Auto-resolve All
          </Button>
          <Button 
            onClick={() => onResolve({ type: 'force' })}
            disabled={isLoading}
          >
            Force Create
          </Button>
        </div>
      </div>
    </div>
  );
}
