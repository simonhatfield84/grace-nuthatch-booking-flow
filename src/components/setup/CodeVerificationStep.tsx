
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, Loader2, RotateCcw } from 'lucide-react';

interface CodeVerificationStepProps {
  email: string;
  onBack: () => void;
  onVerify: (code: string) => Promise<boolean>;
  onResendCode: () => Promise<void>;
  verifyLoading: boolean;
  resendLoading: boolean;
  error?: string;
}

export const CodeVerificationStep: React.FC<CodeVerificationStepProps> = ({
  email,
  onBack,
  onVerify,
  onResendCode,
  verifyLoading,
  resendLoading,
  error
}) => {
  const [code, setCode] = useState('');

  const handleVerify = async () => {
    if (code.length === 6) {
      const success = await onVerify(code);
      if (!success) {
        setCode('');
      }
    }
  };

  const handleResend = async () => {
    await onResendCode();
    setCode('');
  };

  // Auto-verify when 6 digits are entered
  React.useEffect(() => {
    if (code.length === 6 && !verifyLoading) {
      handleVerify();
    }
  }, [code, verifyLoading]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          We've sent a 6-digit verification code to <strong>{email}</strong>. 
          Enter it below to continue.
        </p>
        
        <div className="flex justify-center mb-4">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            disabled={verifyLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        
        {error && (
          <p className="text-sm text-destructive mb-4">{error}</p>
        )}
        
        {verifyLoading && (
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Verifying...</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onBack} disabled={verifyLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleResend} 
          disabled={resendLoading || verifyLoading}
        >
          {resendLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              Resend Code
            </>
          )}
        </Button>
      </div>
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          The code expires in 10 minutes. Check your spam folder if you don't see it.
        </p>
      </div>
    </div>
  );
};
