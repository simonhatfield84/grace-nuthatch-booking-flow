
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminAccountForm } from '@/components/setup/AdminAccountForm';
import { EmailVerificationStep } from '@/components/setup/EmailVerificationStep';
import { VenueSetupForm } from '@/components/setup/VenueSetupForm';
import { SetupStepIndicator } from '@/components/setup/SetupStepIndicator';
import { SetupComplete } from '@/components/setup/SetupComplete';

interface AdminData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

interface VenueData {
  venueName: string;
  venueSlug: string;
  venueEmail: string;
  venuePhone: string;
  venueAddress: string;
}

type SetupStep = 'admin' | 'email-verification' | 'venue' | 'complete';

const Setup = () => {
  const [step, setStep] = useState<SetupStep>('admin');
  const [isUserActive, setIsUserActive] = useState(false);
  const [adminData, setAdminData] = useState<AdminData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [venueData, setVenueData] = useState<VenueData>({
    venueName: '',
    venueSlug: '',
    venueEmail: '',
    venuePhone: '',
    venueAddress: ''
  });
  const [loading, setLoading] = useState(false);
  const [approvalEmailSent, setApprovalEmailSent] = useState(false);
  const [approvalEmailError, setApprovalEmailError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session } = useAuth();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  // Check user status and redirect appropriately
  useEffect(() => {
    const checkUserStatus = async () => {
      console.log('Setup: Checking user status...', { user, session });
      
      // Handle email verification from URL
      const access_token = searchParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token');
      const type = searchParams.get('type');
      
      console.log('Setup: URL parameters:', { 
        access_token: !!access_token, 
        refresh_token: !!refresh_token, 
        type,
        fullUrl: window.location.href 
      });
      
      if (access_token && refresh_token && type === 'signup') {
        console.log('Setup: Processing email verification tokens...');
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (error) {
            console.error('Setup: Session setting error:', error);
            toast({
              title: "Verification Error",
              description: error.message || "Failed to verify email session.",
              variant: "destructive"
            });
            return;
          }
          
          console.log('Setup: Session set successfully:', { 
            user: data.user?.email, 
            confirmed: data.user?.email_confirmed_at,
            session: !!data.session 
          });
          
          if (data.user?.email_confirmed_at) {
            console.log('Setup: Email verified, updating user status');
            
            // Update user to be active for venue setup
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ is_active: true })
              .eq('id', data.user.id);
            
            if (profileError) {
              console.error('Setup: Profile update error:', profileError);
              toast({
                title: "Profile Update Failed",
                description: "Failed to update profile status. Please try again.",
                variant: "destructive"
              });
            } else {
              console.log('Setup: Profile updated successfully');
            }
            
            setStep('venue');
            
            toast({
              title: "Email Verified!",
              description: "Your email has been verified. Let's continue with venue setup.",
            });
            
            // Set admin data from user metadata
            if (data.user.user_metadata) {
              setAdminData(prev => ({
                ...prev,
                email: data.user.email || '',
                firstName: data.user.user_metadata.first_name || '',
                lastName: data.user.user_metadata.last_name || ''
              }));
            }
          } else {
            console.log('Setup: Email not confirmed in verification response');
            toast({
              title: "Verification Incomplete",
              description: "Email verification appears incomplete. Please try clicking the link again.",
              variant: "destructive"
            });
          }
        } catch (error: any) {
          console.error('Setup: Email verification error:', error);
          toast({
            title: "Verification Error",
            description: error.message || "Failed to verify email.",
            variant: "destructive"
          });
        }
        return;
      }

      // Check existing user status
      if (user) {
        console.log('Setup: User exists, checking profile...');
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_active, venue_id')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            console.error('Setup: Profile fetch error:', profileError);
          }
          
          if (profile) {
            console.log('Setup: Profile found:', { is_active: profile.is_active, venue_id: profile.venue_id });
            setIsUserActive(profile.is_active);
            
            // If user is active and has a venue, check if setup is complete
            if (profile.is_active && profile.venue_id) {
              console.log('Setup: User is active with venue, checking setup completion');
              const { data: setupComplete } = await supabase.rpc('setup_complete');
              if (setupComplete) {
                navigate('/admin/dashboard');
                return;
              } else {
                setStep('complete');
              }
            } else if (profile.is_active) {
              // User is active but no venue, go to venue setup
              console.log('Setup: User is active, going to venue setup');
              setStep('venue');
            } else {
              // User exists but not active, check if email is verified
              console.log('Setup: User not active, checking email verification');
              if (user.email_confirmed_at) {
                console.log('Setup: Email confirmed, going to venue setup');
                setStep('venue');
              } else {
                console.log('Setup: Email not confirmed, showing verification step');
                setStep('email-verification');
              }
            }
            
            // Pre-fill admin data if available
            setAdminData(prev => ({
              ...prev,
              email: user.email || '',
              firstName: user.user_metadata?.first_name || '',
              lastName: user.user_metadata?.last_name || ''
            }));
            
            console.log('Setup: User status determined', { isActive: profile.is_active, hasVenue: !!profile.venue_id });
          } else {
            // No profile exists, user needs to start from beginning
            console.log('Setup: No profile found, starting from admin step');
            setStep('admin');
          }
        } catch (error) {
          console.error('Setup: Error checking user status:', error);
          setStep('admin');
        }
      } else {
        // No user session, start from admin step
        console.log('Setup: No user session, starting from admin step');
        setStep('admin');
      }
    };

    checkUserStatus();
  }, [searchParams, toast, navigate, user, session]);

  const handleAdminInputChange = (field: keyof AdminData, value: string) => {
    setAdminData(prev => ({ ...prev, [field]: value }));
  };

  const handleVenueInputChange = (field: keyof VenueData, value: string) => {
    setVenueData(prev => ({ ...prev, [field]: value }));

    // Auto-generate slug from venue name
    if (field === 'venueName') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setVenueData(prev => ({ ...prev, venueSlug: slug }));
    }
  };

  const validateAdminForm = () => {
    if (adminData.password !== adminData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please check and try again.",
        variant: "destructive"
      });
      return false;
    }

    if (adminData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAdminForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Setup: Creating admin user account...');
      // Create admin user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminData.email,
        password: adminData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/setup`,
          data: {
            first_name: adminData.firstName,
            last_name: adminData.lastName
          }
        }
      });

      if (authError) {
        console.error('Setup: Auth error:', authError);
        if (authError.message.includes('User already registered')) {
          toast({
            title: "Account Exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive"
          });
          return;
        }
        throw authError;
      }

      console.log('Setup: User created:', { user: authData.user?.email, confirmed: authData.user?.email_confirmed_at });

      // Check if email confirmation is required
      if (authData.user && !authData.user.email_confirmed_at) {
        console.log('Setup: Email confirmation required');
        toast({
          title: "Check Your Email",
          description: "We've sent you a verification email. Please check your inbox to continue.",
        });
        setStep('email-verification');
      } else {
        // Email is already confirmed, move to venue setup
        console.log('Setup: Email already confirmed, moving to venue setup');
        setStep('venue');
      }

    } catch (error: any) {
      console.error('Admin setup error:', error);
      
      if (error.code === 'over_email_send_rate_limit') {
        toast({
          title: "Too Many Attempts",
          description: "Email rate limit exceeded. Please wait an hour before trying again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account Setup Failed",
          description: error.message || "Failed to create admin account.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    
    try {
      console.log('Setup: Resending verification email...');
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: adminData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/setup`
        }
      });

      if (error) {
        console.error('Setup: Resend error:', error);
        throw error;
      }

      console.log('Setup: Verification email resent successfully');
      toast({
        title: "Email Sent",
        description: "Verification email has been resent. Please check your inbox.",
      });

    } catch (error: any) {
      console.error('Resend verification error:', error);
      
      if (error.code === 'over_email_send_rate_limit') {
        toast({
          title: "Rate Limited",
          description: "Please wait before requesting another verification email.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Failed to Resend",
          description: error.message || "Failed to resend verification email.",
          variant: "destructive"
        });
      }
    } finally {
      setResendLoading(false);
    }
  };

  const resendApprovalRequest = async () => {
    setLoading(true);
    setApprovalEmailError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();

      if (!profile?.venue_id) throw new Error('No venue found for user');

      const { data: venue } = await supabase
        .from('venues')
        .select('*')
        .eq('id', profile.venue_id)
        .single();

      if (!venue) throw new Error('Venue not found');

      const { error: approvalError } = await supabase.functions.invoke('send-approval-request', {
        body: {
          venue_id: venue.id,
          venue_name: venue.name,
          owner_name: `${adminData.firstName} ${adminData.lastName}`,
          owner_email: adminData.email
        }
      });

      if (approvalError) {
        console.error('Approval request failed:', approvalError);
        setApprovalEmailError(approvalError.message || 'Failed to send approval request');
        throw approvalError;
      }

      setApprovalEmailSent(true);
      toast({
        title: "Approval Request Sent",
        description: "We've sent a new approval request to our team.",
      });

    } catch (error: any) {
      console.error('Failed to resend approval request:', error);
      setApprovalEmailError(error.message || 'Failed to send approval request');
      toast({
        title: "Failed to Send Approval",
        description: error.message || "Failed to send approval request.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApprovalEmailError(null);

    try {
      // Get current user session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('No authenticated user found. Please verify your email first.');
      }

      console.log('Creating venue for user:', user.id);

      // Step 1: Create venue with pending status
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert({
          name: venueData.venueName,
          slug: venueData.venueSlug,
          email: venueData.venueEmail,
          phone: venueData.venuePhone,
          address: venueData.venueAddress,
          approval_status: 'pending'
        })
        .select()
        .single();

      if (venueError) {
        console.error('Venue creation error:', venueError);
        throw venueError;
      }

      console.log('Venue created:', venue);

      // Step 2: Create/Update profile with venue association
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          venue_id: venue.id,
          email: adminData.email,
          first_name: adminData.firstName,
          last_name: adminData.lastName,
          role: 'owner',
          is_active: true
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      console.log('Profile updated for user:', user.id);

      // Step 3: Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          venue_id: venue.id,
          role: 'owner'
        });

      if (roleError) {
        console.error('User role creation error:', roleError);
        throw roleError;
      }

      console.log('User role created for user:', user.id);

      // Step 4: Send approval request
      console.log('Sending approval request...');
      
      const { data: approvalResponse, error: approvalError } = await supabase.functions.invoke('send-approval-request', {
        body: {
          venue_id: venue.id,
          venue_name: venueData.venueName,
          owner_name: `${adminData.firstName} ${adminData.lastName}`,
          owner_email: adminData.email
        }
      });

      if (approvalError) {
        console.error('Approval request failed:', approvalError);
        setApprovalEmailError(approvalError.message || 'Failed to send approval request');
      } else {
        console.log('Approval request sent successfully:', approvalResponse);
        setApprovalEmailSent(true);
      }

      // Move to completion step
      setStep('complete');

      toast({
        title: "Venue Setup Complete",
        description: approvalEmailSent ? "Approval request sent successfully!" : "Venue created - you can resend the approval request if needed.",
      });

    } catch (error: any) {
      console.error('Venue setup error:', error);
      toast({
        title: "Venue Setup Failed",
        description: error.message || "An error occurred during venue setup.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'complete') {
    return (
      <SetupComplete
        isUserActive={isUserActive}
        approvalEmailSent={approvalEmailSent}
        approvalEmailError={approvalEmailError}
        loading={loading}
        onResendApproval={resendApprovalRequest}
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
            
            {/* Step indicator */}
            <SetupStepIndicator currentStep={step} />

            {step === 'admin' && (
              <>
                <CardTitle>Create Admin Account</CardTitle>
                <CardDescription>
                  First, let's create your administrator account that will manage the venue.
                </CardDescription>
              </>
            )}

            {step === 'email-verification' && (
              <>
                <CardTitle>Verify Your Email</CardTitle>
                <CardDescription>
                  We've sent a verification email to {adminData.email}. Please check your inbox and click the verification link to continue.
                </CardDescription>
              </>
            )}

            {step === 'venue' && (
              <>
                <CardTitle>Setup Your Venue</CardTitle>
                <CardDescription>
                  Now let's configure your venue information for guests and bookings.
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent>
            {step === 'admin' && (
              <AdminAccountForm
                adminData={adminData}
                onInputChange={handleAdminInputChange}
                onSubmit={handleAdminSubmit}
                loading={loading}
              />
            )}

            {step === 'email-verification' && (
              <EmailVerificationStep
                email={adminData.email}
                onBack={() => setStep('admin')}
                onResend={handleResendVerification}
                resendLoading={resendLoading}
              />
            )}

            {step === 'venue' && (
              <VenueSetupForm
                venueData={venueData}
                onInputChange={handleVenueInputChange}
                onSubmit={handleVenueSubmit}
                onBack={() => setStep('email-verification')}
                loading={loading}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setup;
