
import React from 'react';
import { User, Building, CheckCircle, Mail } from 'lucide-react';

type SetupStep = 'admin' | 'email-verification' | 'venue' | 'complete';

interface SetupStepIndicatorProps {
  currentStep: SetupStep;
}

export const SetupStepIndicator: React.FC<SetupStepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-center space-x-4 mb-4">
      <div className={`flex items-center space-x-2 ${currentStep === 'admin' ? 'text-blue-600' : 'text-green-500'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'admin' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-green-100'}`}>
          {currentStep === 'admin' ? <User className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
        </div>
        <span className="text-sm font-medium">Admin Account</span>
      </div>
      <div className={`w-8 h-0.5 ${currentStep !== 'admin' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
      <div className={`flex items-center space-x-2 ${
        currentStep === 'email-verification' ? 'text-blue-600' : 
        currentStep === 'venue' ? 'text-blue-600' : 
        currentStep === 'complete' ? 'text-green-500' : 
        'text-gray-400'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          currentStep === 'email-verification' ? 'bg-blue-100 border-2 border-blue-600' : 
          currentStep === 'venue' ? 'bg-blue-100 border-2 border-blue-600' : 
          currentStep === 'complete' ? 'bg-green-100' : 
          'bg-gray-100'
        }`}>
          {currentStep === 'email-verification' ? <Mail className="h-4 w-4" /> : 
           currentStep === 'venue' ? <Building className="h-4 w-4" /> : 
           currentStep === 'complete' ? <CheckCircle className="h-4 w-4" /> : 
           <Mail className="h-4 w-4" />}
        </div>
        <span className="text-sm font-medium">
          {currentStep === 'email-verification' ? 'Email Verification' : 'Venue Setup'}
        </span>
      </div>
    </div>
  );
};
