
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSetup } from '@/hooks/useSetup';
import { Loader2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { data: setupComplete, isLoading: setupLoading } = useSetup();
  const location = useLocation();

  if (authLoading || setupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If setup is not complete, show pending approval screen
  if (!setupComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="grace-logo text-4xl font-bold mb-2">grace</div>
            <p className="text-muted-foreground">Hospitality Venue Management System</p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <CardTitle>Account Pending Approval</CardTitle>
              <CardDescription>
                Your venue account is currently being reviewed by our team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-orange-900 dark:text-orange-100">What's happening?</h4>
                <div className="text-sm text-orange-800 dark:text-orange-200 space-y-2">
                  <p>• Our team is reviewing your venue application</p>
                  <p>• You should receive approval within 24 hours</p>
                  <p>• We'll send you an email once your account is approved</p>
                  <p>• Make sure to verify your email address if you haven't already</p>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Need help?</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  If you have any questions, please contact us at <strong>hello@grace-os.co.uk</strong>
                </p>
              </div>

              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline"
                className="w-full"
              >
                Back to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
