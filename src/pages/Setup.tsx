
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Info, CheckCircle, ArrowLeft, User, Building } from 'lucide-react';

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
  const [step, setStep] = useState<'admin' | 'venue' | 'complete'>('admin');
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
  const { toast } = useToast();
  const navigate = useNavigate();

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
      // Step 1: Create admin user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminData.email,
        password: adminData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            first_name: adminData.firstName,
            last_name: adminData.lastName
          }
        }
      });

      if (authError) {
        // Handle "User already registered" gracefully
        if (authError.message.includes('User already registered')) {
          // Try to sign in instead
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: adminData.email,
            password: adminData.password
          });

          if (signInError) {
            throw new Error('Account exists but password is incorrect. Please use the correct password or reset it.');
          }
        } else {
          throw authError;
        }
      }

      // Step 2: Sign in immediately to establish session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: adminData.email,
        password: adminData.password
      });

      if (signInError) throw signInError;

      toast({
        title: "Admin Account Created",
        description: "Now let's set up your venue information.",
      });

      setStep('venue');

    } catch (error: any) {
      console.error('Admin setup error:', error);
      toast({
        title: "Account Setup Failed",
        description: error.message || "Failed to create admin account.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('No authenticated user found. Please try again.');
      }

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

      if (venueError) throw venueError;

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

      if (profileError) throw profileError;

      // Step 3: Create user role (with authenticated user)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          venue_id: venue.id,
          role: 'owner'
        });

      if (roleError) throw roleError;

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
        console.error('Failed to send approval request:', approvalError);
        // Don't fail the setup if approval email fails
      }

      // Step 5: Sign out after setup completion (they'll need to verify email)
      await supabase.auth.signOut();

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
                Your venue account has been created and is pending approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">What happens next?</h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <p>1. <strong>Email Verification:</strong> Check your inbox for a verification email and click the link to confirm your account.</p>
                  <p>2. <strong>Account Approval:</strong> Our team will review your application and approve your venue within 24 hours.</p>
                  <p>3. <strong>Get Started:</strong> Once approved, you'll receive another email with your dashboard access.</p>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-green-900 dark:text-green-100">Your Access URLs</h4>
                <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <p><strong>Admin Dashboard:</strong> {window.location.origin}/admin</p>
                  <p><strong>Host Interface:</strong> {window.location.origin}/host</p>
                </div>
              </div>

              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
              >
                Return to Homepage
              </Button>
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
              <div className={`w-12 h-0.5 ${step === 'venue' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center space-x-2 ${step === 'venue' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'venue' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-100'}`}>
                  <Building className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Venue Setup</span>
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
                    onClick={() => setStep('admin')}
                    className="flex-1"
                  >
                    Back to Admin
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
