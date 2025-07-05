
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Info, CheckCircle } from 'lucide-react';

interface SetupData {
  // Admin user
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  // Venue
  venueName: string;
  venueSlug: string;
  venueEmail: string;
  venuePhone: string;
  venueAddress: string;
}

const Setup = () => {
  const [formData, setFormData] = useState<SetupData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    venueName: '',
    venueSlug: '',
    venueEmail: '',
    venuePhone: '',
    venueAddress: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (field: keyof SetupData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from venue name
    if (field === 'venueName') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setFormData(prev => ({
        ...prev,
        venueSlug: slug
      }));
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please check and try again.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create venue
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert({
          name: formData.venueName,
          slug: formData.venueSlug,
          email: formData.venueEmail,
          phone: formData.venuePhone,
          address: formData.venueAddress,
          approval_status: 'pending'
        })
        .select()
        .single();

      if (venueError) throw venueError;

      // Step 2: Create admin user with email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Step 3: Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          venue_id: venue.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'owner'
        });

      if (profileError) throw profileError;

      // Step 4: Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          venue_id: venue.id,
          role: 'owner'
        });

      if (roleError) throw roleError;

      // Step 5: Send approval request
      const { error: approvalError } = await supabase.functions.invoke('send-approval-request', {
        body: {
          venue_id: venue.id,
          venue_name: formData.venueName,
          owner_name: `${formData.firstName} ${formData.lastName}`,
          owner_email: formData.email
        }
      });

      if (approvalError) {
        console.error('Failed to send approval request:', approvalError);
        // Don't fail the setup if approval email fails
      }

      setSubmitted(true);

    } catch (error: any) {
      console.error('Setup error:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "An error occurred during setup.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
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
                Your restaurant account has been created and is pending approval.
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
                  <p><strong>Admin Dashboard:</strong> app.grace-os.co.uk</p>
                  <p><strong>Host Interface:</strong> host.grace-os.co.uk</p>
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
            <CardTitle>Create Your Restaurant Account</CardTitle>
            <CardDescription>
              Let's get your venue management system configured. This will create your admin account and set up your venue for approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Admin User Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Admin Account</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    minLength={6}
                  />
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>

              {/* Venue Section */}
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <h3 className="text-lg font-semibold">Venue Information</h3>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span className="text-xs">Public information</span>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> This information will be visible to your guests in booking confirmations and email communications.
                  </p>
                </div>
                <div>
                  <Label htmlFor="venueName">Restaurant Name</Label>
                  <Input
                    id="venueName"
                    type="text"
                    value={formData.venueName}
                    onChange={(e) => handleInputChange('venueName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="venueSlug">URL Slug</Label>
                  <Input
                    id="venueSlug"
                    type="text"
                    value={formData.venueSlug}
                    onChange={(e) => handleInputChange('venueSlug', e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This will be used for your email address: {formData.venueSlug}@grace-os.co.uk
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="venueEmail">Contact Email</Label>
                    <Input
                      id="venueEmail"
                      type="email"
                      value={formData.venueEmail}
                      onChange={(e) => handleInputChange('venueEmail', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="venuePhone">Phone Number</Label>
                    <Input
                      id="venuePhone"
                      type="tel"
                      value={formData.venuePhone}
                      onChange={(e) => handleInputChange('venuePhone', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="venueAddress">Address</Label>
                  <Input
                    id="venueAddress"
                    type="text"
                    value={formData.venueAddress}
                    onChange={(e) => handleInputChange('venueAddress', e.target.value)}
                  />
                </div>
              </div>

              {/* Email Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Email Configuration</h3>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Email Setup Preview</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Guest emails will be sent from:</strong> {formData.venueName || 'Your Venue'} &lt;{formData.venueSlug || 'your-venue'}@grace-os.co.uk&gt;</p>
                    <p><strong>Platform emails will be sent from:</strong> Grace OS &lt;noreply@grace-os.co.uk&gt;</p>
                    <p className="text-xs mt-2 opacity-75">Email delivery is automatically configured and managed by Grace OS.</p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account & Request Approval'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setup;
