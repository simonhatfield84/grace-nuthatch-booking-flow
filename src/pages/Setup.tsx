
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
import { 
  SetupStep, 
  AdminData, 
  VenueData, 
  SetupLocationState,
  convertToSetupError 
} from '@/types/setup';

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

  // Properly type the location state
  const locationState = location.state as SetupLocationState | null;
  const from = locationState?.from?.pathname || '/';

  const showError = (error: string) => {
    toast({
      title: "Setup Error",
      description: error,
      variant: "destructive"
    });
  };

  const showSuccess = (message: string) => {
    toast({
      title: "Success",
      description: message,
    });
  };

  // Check user status and redirect appropriately
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Handle email verification from URL
        const access_token = searchParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        
        if (access_token && refresh_token && type === 'signup') {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (error) {
            showError("Failed to verify email session: " + error.message);
            return;
          }
          
          if (data.user?.email_confirmed_at) {
            // Update user to be active for venue setup
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ is_active: true })
              .eq('id', data.user.id);
            
            if (profileError) {
              showError("Failed to update profile status. Please try again.");
            }
            
            setStep('venue');
            showSuccess("Your email has been verified. Let's continue with venue setup.");
            
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
            showError("Email verification appears incomplete. Please try clicking the link again.");
          }
          return;
        }

        // Check existing user status
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_active, venue_id')
            .eq('id', user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }
          
          if (profile) {
            setIsUserActive(profile.is_active);
            
            // If user is active and has a venue, check if setup is complete
            if (profile.is_active && profile.venue_id) {
              const { data: setupComplete } = await supabase.rpc('setup_complete');
              if (setupComplete) {
                navigate('/admin/dashboard');
                return;
              } else {
                setStep('complete');
              }
            } else if (profile.is_active) {
              // User is active but no venue, go to venue setup
              setStep('venue');
            } else {
              // User exists but not active, check if email is verified
              if (user.email_confirmed_at) {
                setStep('venue');
              } else {
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
          } else {
            // No profile exists, user needs to start from beginning
            setStep('admin');
          }
        } else {
          // No user session, start from admin step
          setStep('admin');
        }
      } catch (error) {
        const setupError = convertToSetupError(error);
        showError("Error checking user status: " + setupError.message);
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

  const validateAdminForm = (): boolean => {
    if (adminData.password !== adminData.confirmPassword) {
      showError("Passwords do not match. Please check and try again.");
      return false;
    }

    if (adminData.password.length < 6) {
      showError("Password must be at least 6 characters long.");
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
        const setupError = convertToSetupError(authError);
        
        if (setupError.message.includes('User already registered')) {
          showError("An account with this email already exists. Please sign in instead.");
          return;
        }
        throw setupError;
      }

      // Check if email confirmation is required
      if (authData.user && !authData.user.email_confirmed_at) {
        showSuccess("We've sent you a verification email. Please check your inbox to continue.");
        setStep('email-verification');
      } else {
        // Email is already confirmed, move to venue setup
        setStep('venue');
      }

    } catch (error) {
      const setupError = convertToSetupError(error);
      
      if (setupError.code === 'over_email_send_rate_limit') {
        showError("Email rate limit exceeded. Please wait an hour before trying again.");
      } else {
        showError("Failed to create admin account: " + setupError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: adminData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/setup`
        }
      });

      if (error) {
        throw error;
      }

      showSuccess("Verification email has been resent. Please check your inbox.");

    } catch (error) {
      const setupError = convertToSetupError(error);
      
      if (setupError.code === 'over_email_send_rate_limit') {
        showError("Please wait before requesting another verification email.");
      } else {
        showError("Failed to resend verification email: " + setupError.message);
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
        setApprovalEmailError(approvalError.message || 'Failed to send approval request');
        throw approvalError;
      }

      setApprovalEmailSent(true);
      showSuccess("We've sent a new approval request to our team.");

    } catch (error) {
      const setupError = convertToSetupError(error);
      setApprovalEmailError(setupError.message || 'Failed to send approval request');
      showError("Failed to send approval request: " + setupError.message);
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
        throw venueError;
      }

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
        throw profileError;
      }

      // Step 3: Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          venue_id: venue.id,
          role: 'owner'
        });

      if (roleError) {
        throw roleError;
      }

      // Step 4: Send approval request
      const { error: approvalError } = await supabase.functions.invoke('send-approval-request', {
        body: {
          venue_id: venue.id,
          venue_name: venueData.venueName,
          owner_name: `${adminData.firstName} ${adminData.lastName}`,
          owner_email: adminData.email
        }
      });

      if (approvalError) {
        setApprovalEmailError(approvalError.message || 'Failed to send approval request');
      } else {
        setApprovalEmailSent(true);
      }

      // Move to completion step
      setStep('complete');

      showSuccess(approvalEmailSent ? "Approval request sent successfully!" : "Venue created - you can resend the approval request if needed.");

    } catch (error) {
      const setupError = convertToSetupError(error);
      showError("An error occurred during venue setup: " + setupError.message);
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
