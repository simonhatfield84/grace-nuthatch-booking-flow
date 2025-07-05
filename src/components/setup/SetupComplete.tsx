
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';

interface SetupCompleteProps {
  isUserActive: boolean;
  approvalEmailSent: boolean;
  approvalEmailError: string | null;
  loading: boolean;
  onResendApproval: () => void;
}

export const SetupComplete: React.FC<SetupCompleteProps> = ({
  isUserActive,
  approvalEmailSent,
  approvalEmailError,
  loading,
  onResendApproval
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="grace-logo text-4xl font-bold mb-2">grace</div>
          <p className="text-muted-foreground">Hospitality Venue Management System</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Setup Complete!</CardTitle>
            <CardDescription>
              {isUserActive 
                ? 'Your venue has been approved and is now active!'
                : 'Your venue account has been created and is pending approval.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Approval Status */}
            {!isUserActive && (
              <div className={`p-4 rounded-lg ${approvalEmailSent ? 'bg-blue-50 dark:bg-blue-950' : 'bg-orange-50 dark:bg-orange-950'}`}>
                <div className="flex items-start gap-3">
                  {approvalEmailSent ? (
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
                      {approvalEmailSent ? 'Approval Request Sent' : 'Approval Request Pending'}
                    </h4>
                    <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                      {approvalEmailSent ? (
                        <p>Our team has been notified and will review your application within 24 hours. You'll receive an email once approved.</p>
                      ) : (
                        <>
                          <p>There was an issue sending the approval email automatically.</p>
                          {approvalEmailError && (
                            <p className="text-red-600 dark:text-red-400 text-xs">Error: {approvalEmailError}</p>
                          )}
                          <Button 
                            onClick={onResendApproval} 
                            disabled={loading}
                            size="sm"
                            variant="outline"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              'Send Approval Request'
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {isUserActive ? (
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-green-900 dark:text-green-100">Ready to Get Started</h4>
                <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <p>Your account is active and you can access the dashboard immediately.</p>
                  <p><strong>Admin Dashboard:</strong> {window.location.origin}/admin</p>
                  <p><strong>Host Interface:</strong> {window.location.origin}/host</p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">What happens next?</h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p>1. Our team will review your venue application</p>
                  <p>2. You'll receive an email notification once approved</p>
                  <p>3. After approval, you can access your admin dashboard</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {isUserActive ? (
                <>
                  <Button 
                    onClick={() => navigate('/admin/dashboard')} 
                    className="flex-1"
                  >
                    Go to Dashboard
                  </Button>
                  <Button 
                    onClick={() => navigate('/home')} 
                    variant="outline"
                    className="flex-1"
                  >
                    Return to Homepage
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => navigate('/home')} 
                  variant="outline"
                  className="w-full"
                >
                  Return to Homepage
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
