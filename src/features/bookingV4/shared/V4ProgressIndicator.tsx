interface Step {
  id: string;
  name: string;
}

interface V4ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  accentColor?: string;
}

export function V4ProgressIndicator({ steps, currentStep, accentColor = '#f59e0b' }: V4ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index <= currentStep
                  ? 'text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
              style={index <= currentStep ? { backgroundColor: accentColor } : {}}
            >
              {index + 1}
            </div>
            <span className={`text-xs mt-1 ${index <= currentStep ? 'font-medium' : 'text-gray-500'}`}>
              {step.name}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 h-0.5 bg-gray-200 mx-2 relative top-[-12px]">
              <div
                className="h-full transition-all"
                style={{
                  width: index < currentStep ? '100%' : '0%',
                  backgroundColor: accentColor
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
