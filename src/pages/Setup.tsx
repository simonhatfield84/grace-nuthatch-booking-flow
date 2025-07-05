
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Info } from 'lucide-react';

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
    venueName: 'The Nuthatch',
    venueSlug: 'the-nuthatch',
    venueEmail: '',
    venuePhone: '',
    venueAddress: ''
  });
  const [loading, setLoading] = useState(false);
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
          address: formData.venueAddress
        })
        .select()
        .single();

      if (venueError) throw venueError;

      // Step 2: Create admin user
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

      toast({
        title: "Setup Complete!",
        description: "Your restaurant system has been configured successfully."
      });

      navigate('/');
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="grace-logo text-4xl font-bold mb-2">grace</div>
          <p className="text-muted-foreground">Hospitality Venue Management System Setup</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Initial Setup</CardTitle>
            <CardDescription>
              Let's get your venue management system configured. This will create your admin account and set up your venue.
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
                    <p><strong>Guest emails will be sent from:</strong> {formData.venueName} &lt;{formData.venueSlug}@grace-os.co.uk&gt;</p>
                    <p><strong>Platform emails will be sent from:</strong> Grace OS &lt;noreply@grace-os.co.uk&gt;</p>
                    <p className="text-xs mt-2 opacity-75">Email delivery is automatically configured and managed by Grace OS.</p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Complete Setup'
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
