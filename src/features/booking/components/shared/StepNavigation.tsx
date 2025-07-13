
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  showBack?: boolean;
}

export function StepNavigation({ 
  currentStep, 
  totalSteps, 
  onBack, 
  showBack = true 
}: StepNavigationProps) {
  if (!showBack || currentStep === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <Button 
        variant="outline" 
        onClick={onBack}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>
    </div>
  );
}
