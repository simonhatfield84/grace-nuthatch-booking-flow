
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { PasswordStrength } from '@/components/ui/password-strength';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Check for password reset tokens in URL
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const type = searchParams.get('type');
  const isPasswordReset = type === 'recovery' && accessToken && refreshToken;

  // Check user type after login to determine redirect
  const { data: userType, isLoading: userTypeLoading } = useQuery({
    queryKey: ['user-type', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Check if platform admin
      const { data: platformAdmin } = await supabase
        .from('platform_admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (platformAdmin) return 'platform_admin';

      // Check if venue admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id, is_active')
        .eq('id', user.id)
        .eq('is_active', true)
        .single();

      if (profile && profile.venue_id) return 'venue_admin';

      return 'unknown';
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (user && userType && !userTypeLoading) {
      const from = location.state?.from?.pathname;
      
      // Redirect based on user type
      if (userType === 'platform_admin') {
        navigate(from || '/platform/dashboard', { replace: true });
      } else if (userType === 'venue_admin') {
        navigate(from || '/admin/dashboard', { replace: true });
      } else {
        // Unknown user type, redirect to homepage
        navigate('/', { replace: true });
      }
    }
  }, [user, userType, userTypeLoading, navigate, location.state]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign In Failed",
        description: error.message || "An error occurred during sign in.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://grace-os.co.uk/auth`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Reset Failed",
        description: error.message || "An error occurred sending the reset email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading if checking user type
  if (user && userTypeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show password reset form if tokens are present
  if (isPasswordReset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="grace-logo text-4xl font-bold mb-2">grace</div>
            <p className="text-muted-foreground">Reset Your Password</p>
          </div>
          <PasswordResetForm accessToken={accessToken} refreshToken={refreshToken} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="grace-logo text-4xl font-bold mb-2">grace</div>
          <p className="text-muted-foreground">Hospitality Venue Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setShowPasswordStrength(e.target.value.length > 0);
                  }}
                  required
                  disabled={loading}
                  minLength={12}
                />
                {showPasswordStrength && (
                  <div className="mt-2">
                    <PasswordStrength 
                      password={password} 
                      onValidityChange={setIsPasswordValid}
                    />
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || (showPasswordStrength && !isPasswordValid)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Forgot Password?
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
