
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AdminAccountForm } from '@/components/setup/AdminAccountForm';
import { CodeVerificationStep } from '@/components/setup/CodeVerificationStep';
import { VenueSetupForm } from '@/components/setup/VenueSetupForm';
import { SetupStepIndicator } from '@/components/setup/SetupStepIndicator';
import { SetupComplete } from '@/components/setup/SetupComplete';
import { useSetupFlow } from '@/hooks/useSetupFlow';

const Setup = () => {
  const navigate = useNavigate();
  const {
    state,
    updateAdminData,
    updateVenueData,
    createAdminAccount,
    verifyCode,
    resendVerificationCode,
    createVenue,
    updateState
  } = useSetupFlow();

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAdminAccount();
  };

  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createVenue();
  };

  const handleBack = () => {
    if (state.step === 'code-verification') {
      updateState({ step: 'admin' });
    } else if (state.step === 'venue') {
      updateState({ step: 'code-verification' });
    }
  };

  if (state.step === 'complete') {
    return (
      <SetupComplete
        isUserActive={true}
        approvalEmailSent={true}
        approvalEmailError={null}
        loading={false}
        onResendApproval={() => {}}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="grace-logo text-4xl font-bold mb-2">grace</div>
          <p className="text-muted-foreground">Hospitality Venue Management System Setup</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/home">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
            
            <SetupStepIndicator currentStep={state.step} />

            {state.step === 'admin' && (
              <>
                <CardTitle>Create Admin Account</CardTitle>
                <CardDescription>
                  First, let's create your administrator account that will manage the venue.
                </CardDescription>
              </>
            )}

            {state.step === 'code-verification' && (
              <>
                <CardTitle>Verify Your Email</CardTitle>
                <CardDescription>
                  We've sent a 6-digit verification code to your email address.
                </CardDescription>
              </>
            )}

            {state.step === 'venue' && (
              <>
                <CardTitle>Setup Your Venue</CardTitle>
                <CardDescription>
                  Now let's configure your venue information for guests and bookings.
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent>
            {state.step === 'admin' && (
              <AdminAccountForm
                adminData={state.adminData}
                onInputChange={updateAdminData}
                onSubmit={handleAdminSubmit}
                loading={state.loading}
              />
            )}

            {state.step === 'code-verification' && (
              <CodeVerificationStep
                email={state.adminData.email}
                onBack={handleBack}
                onVerify={verifyCode}
                onResendCode={resendVerificationCode}
                verifyLoading={state.verifyLoading}
                resendLoading={state.resendLoading}
                error={state.error}
              />
            )}

            {state.step === 'venue' && (
              <VenueSetupForm
                venueData={state.venueData}
                onInputChange={updateVenueData}
                onSubmit={handleVenueSubmit}
                onBack={handleBack}
                loading={state.loading}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setup;
