
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Info, CheckCircle, ArrowLeft, User, Building, AlertTriangle, Mail, RefreshCw } from 'lucide-react';

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

const Setup = () => {
  const [step, setStep] = useState<'admin' | 'email-verification' | 'venue' | 'complete'>('admin');
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

  // Check for email verification on component mount
  useEffect(() => {
    const checkEmailVerification = async () => {
      // Check if we're returning from email verification
      const access_token = searchParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token');
      
      if (access_token && refresh_token) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (error) throw error;
          
          if (data.user?.email_confirmed_at) {
            toast({
              title: "Email Verified!",
              description: "Your email has been verified. Let's continue with venue setup.",
            });
            setStep('venue');
          }
        } catch (error: any) {
          console.error('Email verification error:', error);
          toast({
            title: "Verification Error",
            description: error.message || "Failed to verify email.",
            variant: "destructive"
          });
        }
      }
    };

    checkEmailVerification();
  }, [searchParams, toast]);

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
      // Step 1: Create admin user account with email verification
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
        // Handle "User already registered" gracefully
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

      // Check if email confirmation is required
      if (authData.user && !authData.user.email_confirmed_at) {
        toast({
          title: "Check Your Email",
          description: "We've sent you a verification email. Please check your inbox to continue.",
        });
        setStep('email-verification');
      } else {
        // Email is already confirmed, proceed to venue setup
        setStep('venue');
      }

    } catch (error: any) {
      console.error('Admin setup error:', error);
      
      // Handle rate limit error more gracefully
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
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: adminData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/setup`
        }
      });

      if (error) throw error;

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

      // Step 1: Create venue
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

      // Step 2: Create profile (with authenticated user)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          venue_id: venue.id,
          email: adminData.email,
          first_name: adminData.firstName,
          last_name: adminData.lastName,
          role: 'owner'
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      console.log('Profile created for user:', user.id);

      // Step 3: Create user role (with authenticated user)
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

      // Step 4: Send approval request with improved error handling
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
        // Don't throw here - venue setup was successful, just approval email failed
      } else {
        console.log('Approval request sent successfully:', approvalResponse);
        setApprovalEmailSent(true);
      }

      // Step 5: Move to completion step regardless of approval email status
      toast({
        title: "Venue Setup Complete",
        description: approvalEmailSent ? "Approval request sent successfully!" : "Venue created - you can resend the approval request if needed.",
      });

      setStep('complete');

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
                Your venue account has been created successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Approval Status */}
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
                            onClick={resendApprovalRequest} 
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
              
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-green-900 dark:text-green-100">Ready to Get Started</h4>
                <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <p>Your account is active and you can access the dashboard immediately.</p>
                  <p><strong>Admin Dashboard:</strong> {window.location.origin}/admin</p>
                  <p><strong>Host Interface:</strong> {window.location.origin}/host</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => navigate('/admin')} 
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline"
                  className="flex-1"
                >
                  Return to Homepage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
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
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
            
            {/* Step indicator */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className={`flex items-center space-x-2 ${step === 'admin' ? 'text-blue-600' : 'text-green-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'admin' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-green-100'}`}>
                  {step === 'admin' ? <User className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                </div>
                <span className="text-sm font-medium">Admin Account</span>
              </div>
              <div className={`w-8 h-0.5 ${step === 'email-verification' || step === 'venue' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center space-x-2 ${step === 'email-verification' ? 'text-blue-600' : step === 'venue' ? 'text-blue-600' : step === 'admin' ? 'text-gray-400' : 'text-green-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'email-verification' ? 'bg-blue-100 border-2 border-blue-600' : step === 'venue' ? 'bg-blue-100 border-2 border-blue-600' : step === 'admin' ? 'bg-gray-100' : 'bg-green-100'}`}>
                  {step === 'email-verification' ? <Mail className="h-4 w-4" /> : step === 'venue' ? <Building className="h-4 w-4" /> : step === 'admin' ? <Mail className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                </div>
                <span className="text-sm font-medium">
                  {step === 'email-verification' ? 'Email Verification' : 'Venue Setup'}
                </span>
              </div>
            </div>

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
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={adminData.firstName}
                      onChange={(e) => handleAdminInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={adminData.lastName}
                      onChange={(e) => handleAdminInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={adminData.email}
                    onChange={(e) => handleAdminInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={adminData.password}
                    onChange={(e) => handleAdminInputChange('password', e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={adminData.confirmPassword}
                    onChange={(e) => handleAdminInputChange('confirmPassword', e.target.value)}
                    required
                    minLength={6}
                  />
                  {adminData.confirmPassword && adminData.password !== adminData.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">Passwords do not match</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Admin Account'
                  )}
                </Button>
              </form>
            )}

            {step === 'email-verification' && (
              <div className="space-y-6">
                <div className="text-center">
                  <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Check Your Email</h3>
                  <p className="text-muted-foreground mb-4">
                    We've sent a verification email to <strong>{adminData.email}</strong>
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
                    onClick={() => setStep('admin')}
                    className="flex-1"
                  >
                    Back to Account
                  </Button>
                  <Button 
                    onClick={handleResendVerification}
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
            )}

            {step === 'venue' && (
              <form onSubmit={handleVenueSubmit} className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> This information will be visible to your guests in booking confirmations and email communications.
                  </p>
                </div>
                <div>
                  <Label htmlFor="venueName">Venue Name</Label>
                  <Input
                    id="venueName"
                    type="text"
                    value={venueData.venueName}
                    onChange={(e) => handleVenueInputChange('venueName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="venueSlug">URL Slug</Label>
                  <Input
                    id="venueSlug"
                    type="text"
                    value={venueData.venueSlug}
                    onChange={(e) => handleVenueInputChange('venueSlug', e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This will be used for your email address: {venueData.venueSlug}@grace-os.co.uk
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="venueEmail">Contact Email</Label>
                    <Input
                      id="venueEmail"
                      type="email"
                      value={venueData.venueEmail}
                      onChange={(e) => handleVenueInputChange('venueEmail', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="venuePhone">Phone Number</Label>
                    <Input
                      id="venuePhone"
                      type="tel"
                      value={venueData.venuePhone}
                      onChange={(e) => handleVenueInputChange('venuePhone', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="venueAddress">Address</Label>
                  <Input
                    id="venueAddress"
                    type="text"
                    value={venueData.venueAddress}
                    onChange={(e) => handleVenueInputChange('venueAddress', e.target.value)}
                  />
                </div>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Email Setup Preview</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Guest emails will be sent from:</strong> {venueData.venueName || 'Your Venue'} &lt;{venueData.venueSlug || 'your-venue'}@grace-os.co.uk&gt;</p>
                    <p><strong>Platform emails will be sent from:</strong> Grace OS &lt;noreply@grace-os.co.uk&gt;</p>
                    <p className="text-xs mt-2 opacity-75">Email delivery is automatically configured and managed by Grace OS.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep('email-verification')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Venue...
                      </>
                    ) : (
                      'Complete Setup'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setup;
