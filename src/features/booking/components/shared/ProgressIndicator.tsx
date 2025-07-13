
import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export function ProgressIndicator({ currentStep, totalSteps, stepTitles }: ProgressIndicatorProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentStepTitle = stepTitles[currentStep] || '';

  return (
    <div className="mb-8">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">Make a Reservation</h1>
        <p className="text-muted-foreground">{currentStepTitle}</p>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
