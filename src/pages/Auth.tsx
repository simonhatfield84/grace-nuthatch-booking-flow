
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
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
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

  console.log('🔐 Auth component - User:', user?.email, 'Password Reset:', isPasswordReset, 'Show Password Change:', showPasswordChange);

  // Check user type after login to determine redirect
  const { data: userType, isLoading: userTypeLoading } = useQuery({
    queryKey: ['user-type', user?.id],
    queryFn: async () => {
      if (!user) return null;

      console.log('🔍 Checking user type for:', user.email);

      // Check if platform admin
      const { data: platformAdmin } = await supabase
        .from('platform_admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (platformAdmin) {
        console.log('👑 User is platform admin');
        return 'platform_admin';
      }

      // Check if venue admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id, is_active')
        .eq('id', user.id)
        .eq('is_active', true)
        .single();

      if (profile && profile.venue_id) {
        console.log('🏢 User is venue admin');
        return 'venue_admin';
      }

      console.log('❓ Unknown user type');
      return 'unknown';
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (user && userType && !userTypeLoading) {
      const from = location.state?.from?.pathname;
      
      console.log('🔄 Redirecting user:', { userType, from });
      
      // Check if user needs to set a new password (common for temp passwords)
      const needsPasswordReset = searchParams.get('needs_password_reset') === 'true';
      
      if (needsPasswordReset || isPasswordReset) {
        console.log('🔒 User needs to set new password');
        setShowPasswordChange(true);
        return;
      }
      
      // Redirect based on user type - FIXED: venue_admin goes to /dashboard not /admin/dashboard
      if (userType === 'platform_admin') {
        navigate(from || '/platform/dashboard', { replace: true });
      } else if (userType === 'venue_admin') {
        console.log('🏠 Redirecting venue admin to /dashboard');
        navigate(from || '/dashboard', { replace: true });
      } else {
        // Unknown user type, redirect to homepage
        navigate('/', { replace: true });
      }
    }
  }, [user, userType, userTypeLoading, navigate, location.state, searchParams, isPasswordReset]);

  // Handle password input change
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('🔑 Attempting sign in for:', email);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('✅ Sign in successful');
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      toast({
        title: "Sign In Failed",
        description: error.message || "An error occurred during sign in.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('📝 Attempting sign up for:', email);

    try {
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      console.log('✅ Sign up successful');
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      toast({
        title: "Sign Up Failed",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (newPassword: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      console.log('✅ Password updated successfully');
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
      
      setShowPasswordChange(false);
      
      // Redirect after password change
      if (userType === 'platform_admin') {
        navigate('/platform/dashboard', { replace: true });
      } else if (userType === 'venue_admin') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error('❌ Password update error:', error);
      toast({
        title: "Password Update Failed",
        description: error.message || "An error occurred updating your password.",
        variant: "destructive",
      });
    } finally {
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
    console.log('📧 Sending password reset for:', email);
    
    try {
      // Use the current domain for the redirect URL
      const redirectUrl = `${window.location.origin}/auth`;
      
      console.log('🔗 Password reset redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      console.log('✅ Password reset email sent');
      toast({
        title: "Password Reset Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
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

  // Show password change form if user needs to set new password
  if (showPasswordChange && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="grace-logo text-4xl font-bold mb-2">grace</div>
            <p className="text-muted-foreground">Set Your New Password</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Password Required</CardTitle>
              <CardDescription>
                Please set a new password to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                if (password && isPasswordValid) {
                  handlePasswordUpdate(password);
                }
              }} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={password}
                    onChange={handlePasswordInputChange}
                    required
                    disabled={loading}
                    minLength={12}
                  />
                  <div className="mt-2">
                    <PasswordStrength 
                      password={password} 
                      onValidityChange={setIsPasswordValid}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !isPasswordValid || !password}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    'Set New Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show password reset form if tokens are present
  if (isPasswordReset) {
    console.log('🔒 Showing password reset form');
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
            <CardTitle>{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Create a new account to get started.' 
                : 'Sign in to your account to access the admin dashboard.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
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
                  onChange={handlePasswordInputChange}
                  required
                  disabled={loading}
                  minLength={isSignUp ? 12 : undefined}
                />
                {/* FIXED: Only show password strength during sign up */}
                {isSignUp && (
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
                disabled={loading || (isSignUp && !isPasswordValid)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? 'Creating Account...' : 'Signing in...'}
                  </>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsSignUp(!isSignUp)}
                  disabled={loading}
                >
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </Button>

                {!isSignUp && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    Forgot Password?
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
