import { Check } from "lucide-react";

export interface ProgressIndicatorProps {
  steps: Array<{
    id: string;
    name: string;
    icon: any;
    isValid: boolean;
    isCompleted: boolean;
  }>;
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export function ProgressIndicator({ steps, currentStep, onStepClick }: ProgressIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = step.isCompleted;
          const isClickable = onStepClick && (isCompleted || index < currentStep);
          
          return (
            <div
              key={step.id}
              className={`flex items-center ${
                index < steps.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${isCompleted 
                    ? 'bg-nuthatch-green border-nuthatch-green text-nuthatch-white' 
                    : isActive 
                    ? 'border-nuthatch-green text-nuthatch-green bg-nuthatch-white' 
                    : 'border-nuthatch-border text-nuthatch-muted bg-nuthatch-white'
                  }
                  ${isClickable ? 'cursor-pointer hover:scale-105' : ''}
                `}
                onClick={() => isClickable && onStepClick(index)}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    step.isCompleted ? 'bg-nuthatch-green' : 'bg-nuthatch-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="text-center min-w-0 flex-1">
            <p
              className={`text-sm font-medium truncate ${
                index === currentStep
                  ? 'text-nuthatch-green'
                  : step.isCompleted
                  ? 'text-nuthatch-dark'
                  : 'text-nuthatch-muted'
              }`}
            >
              {step.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}