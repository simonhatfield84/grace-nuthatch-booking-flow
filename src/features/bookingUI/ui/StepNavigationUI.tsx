import { cn } from '@/lib/utils';

interface Step {
  id: string;
  name: string;
  label?: string;
}

interface StepNavigationUIProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

export function StepNavigationUI({ steps, currentStep, onStepClick }: StepNavigationUIProps) {
  return (
    <div className="flex border-b border-gray-200 bg-gray-50">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isDisabled = index > currentStep;
        
        return (
          <button
            key={step.id}
            onClick={() => !isDisabled && onStepClick(index)}
            disabled={isDisabled}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium border-r last:border-r-0 border-gray-200 transition-colors",
              isActive && "bg-white text-black",
              !isActive && !isDisabled && "bg-gray-50 text-gray-700 hover:bg-gray-100",
              isDisabled && "bg-gray-50 text-gray-400 cursor-not-allowed",
            )}
          >
            <div className="text-center">
              <div>{step.name}</div>
              {step.label && (
                <div className="text-xs text-gray-500 mt-1">{step.label}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
