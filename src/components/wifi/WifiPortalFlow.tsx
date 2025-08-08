
import React, { useState } from 'react';
import { WelcomeStep } from './WelcomeStep';
import { GuestDetailsStep } from './GuestDetailsStep';
import { TermsStep } from './TermsStep';
import { SuccessStep } from './SuccessStep';

interface WifiPortalFlowProps {
  venue: any;
  deviceFingerprint: string;
}

export type WifiStep = 'welcome' | 'details' | 'terms' | 'success';

export interface WifiGuestData {
  name: string;
  email: string;
  phone: string;
  opt_in_marketing: boolean;
  acceptedTerms: boolean;
}

export const WifiPortalFlow: React.FC<WifiPortalFlowProps> = ({ venue, deviceFingerprint }) => {
  const [currentStep, setCurrentStep] = useState<WifiStep>('welcome');
  const [guestData, setGuestData] = useState<WifiGuestData>({
    name: '',
    email: '',
    phone: '',
    opt_in_marketing: false,
    acceptedTerms: false
  });
  const [sessionToken, setSessionToken] = useState<string>('');

  const handleStepChange = (step: WifiStep) => {
    setCurrentStep(step);
  };

  const handleGuestDataUpdate = (data: Partial<WifiGuestData>) => {
    setGuestData(prev => ({ ...prev, ...data }));
  };

  const handleWifiAccess = (token: string) => {
    setSessionToken(token);
    setCurrentStep('success');
  };

  switch (currentStep) {
    case 'welcome':
      return (
        <WelcomeStep
          venue={venue}
          onNext={() => handleStepChange('details')}
        />
      );
    case 'details':
      return (
        <GuestDetailsStep
          venue={venue}
          deviceFingerprint={deviceFingerprint}
          guestData={guestData}
          onGuestDataUpdate={handleGuestDataUpdate}
          onNext={() => handleStepChange('terms')}
          onBack={() => handleStepChange('welcome')}
        />
      );
    case 'terms':
      return (
        <TermsStep
          venue={venue}
          deviceFingerprint={deviceFingerprint}
          guestData={guestData}
          onGuestDataUpdate={handleGuestDataUpdate}
          onWifiAccess={handleWifiAccess}
          onBack={() => handleStepChange('details')}
        />
      );
    case 'success':
      return (
        <SuccessStep
          venue={venue}
          sessionToken={sessionToken}
          guestData={guestData}
        />
      );
    default:
      return null;
  }
};
