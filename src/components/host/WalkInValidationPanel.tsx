
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, CheckCircle, Info } from "lucide-react";
import { ValidationResult } from "@/services/walkInValidationService";

interface WalkInValidationPanelProps {
  validation: ValidationResult | null;
  isValidating: boolean;
}

export const WalkInValidationPanel = ({ validation, isValidating }: WalkInValidationPanelProps) => {
  if (isValidating) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Validating booking details...
        </AlertDescription>
      </Alert>
    );
  }

  if (!validation) return null;

  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;

  return (
    <div className="space-y-3">
      {/* Errors */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Please fix the following issues:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validation.errors.map((error, index) => (
                  <li key={index}>
                    <span className="font-medium capitalize">{error.field}:</span> {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {hasWarnings && !hasErrors && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-2">
              <div className="font-medium">Please review:</div>
              <div className="space-y-2">
                {validation.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="flex-1">
                      <span className="font-medium capitalize">{warning.field}:</span> {warning.message}
                    </div>
                    <Badge 
                      variant={warning.canProceed ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {warning.canProceed ? "Can proceed" : "Must fix"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success */}
      {!hasErrors && !hasWarnings && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All validation checks passed. Ready to create walk-in booking.
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Summary */}
      {(hasErrors || hasWarnings) && (
        <div className="flex gap-2 text-xs text-muted-foreground">
          {hasErrors && (
            <Badge variant="destructive" className="text-xs">
              {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {hasWarnings && (
            <Badge variant="secondary" className="text-xs">
              {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
