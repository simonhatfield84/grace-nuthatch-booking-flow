
import React from 'react';
import { User, Building, CheckCircle, Shield } from 'lucide-react';

type SetupStep = 'admin' | 'code-verification' | 'venue' | 'complete';

interface SetupStepIndicatorProps {
  currentStep: SetupStep;
}

interface StepConfig {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

export const SetupStepIndicator: React.FC<SetupStepIndicatorProps> = ({ currentStep }) => {
  const getStepConfig = (step: SetupStep): StepConfig => {
    const stepOrder = ['admin', 'code-verification', 'venue', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    const isCompleted = stepIndex < currentIndex;
    const isActive = stepIndex === currentIndex;
    
    switch (step) {
      case 'admin':
        return {
          icon: isCompleted ? <CheckCircle className="h-4 w-4" /> : <User className="h-4 w-4" />,
          label: 'Admin Account',
          isActive,
          isCompleted
        };
      case 'code-verification':
        return {
          icon: isCompleted ? <CheckCircle className="h-4 w-4" /> : <Shield className="h-4 w-4" />,
          label: 'Verify Email',
          isActive,
          isCompleted
        };
      case 'venue':
        return {
          icon: isCompleted ? <CheckCircle className="h-4 w-4" /> : <Building className="h-4 w-4" />,
          label: 'Venue Setup',
          isActive,
          isCompleted
        };
      case 'complete':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Complete',
          isActive,
          isCompleted: false
        };
      default:
        return {
          icon: <User className="h-4 w-4" />,
          label: 'Unknown',
          isActive: false,
          isCompleted: false
        };
    }
  };

  const steps: SetupStep[] = ['admin', 'code-verification', 'venue'];
  
  return (
    <div className="flex items-center justify-center space-x-4 mb-4">
      {steps.map((step, index) => {
        const config = getStepConfig(step);
        const isLast = index === steps.length - 1;
        
        return (
          <React.Fragment key={step}>
            <div className={`flex items-center space-x-2 ${
              config.isActive ? 'text-blue-600' : 
              config.isCompleted ? 'text-green-500' : 
              'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                config.isActive ? 'bg-blue-100 border-2 border-blue-600' : 
                config.isCompleted ? 'bg-green-100' : 
                'bg-gray-100'
              }`}>
                {config.icon}
              </div>
              <span className="text-sm font-medium">{config.label}</span>
            </div>
            {!isLast && (
              <div className={`w-8 h-0.5 ${
                config.isCompleted ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
