
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, Loader2 } from 'lucide-react';

interface EmailVerificationStepProps {
  email: string;
  onBack: () => void;
  onResend: () => void;
  resendLoading: boolean;
}

export const EmailVerificationStep: React.FC<EmailVerificationStepProps> = ({
  email,
  onBack,
  onResend,
  resendLoading
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Check Your Email</h3>
        <p className="text-muted-foreground mb-4">
          We've sent a verification email to <strong>{email}</strong>
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Click the verification link in the email to continue with your venue setup. 
          The link will bring you back here automatically.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
        <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
          Having trouble?
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Check your spam/junk folder</li>
          <li>• Make sure the email address is correct</li>
          <li>• Wait a few minutes for the email to arrive</li>
          <li>• Click the button below to resend if needed</li>
        </ul>
      </div>

      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          className="flex-1"
        >
          Back to Account
        </Button>
        <Button 
          onClick={onResend}
          disabled={resendLoading}
          className="flex-1"
        >
          {resendLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resending...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend Email
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
