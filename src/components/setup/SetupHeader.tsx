
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SetupStep } from '@/types/setup';
import { SetupStepIndicator } from './SetupStepIndicator';

interface SetupHeaderProps {
  currentStep: SetupStep;
}

export const SetupHeader: React.FC<SetupHeaderProps> = ({ currentStep }) => {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Link to="/home">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      <div className="grace-logo text-4xl font-bold mb-2">grace</div>
      <p className="text-muted-foreground mb-6">Hospitality Venue Management System Setup</p>
      
      <SetupStepIndicator currentStep={currentStep} />
    </div>
  );
};
