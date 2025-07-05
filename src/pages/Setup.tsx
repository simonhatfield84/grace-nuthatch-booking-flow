
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface SetupData {
  // Admin user
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  // Venue
  venueName: string;
  venueSlug: string;
  venueEmail: string;
  venuePhone: string;
  venueAddress: string;
  // Resend API Key
  resendApiKey: string;
}

const Setup = () => {
  const [formData, setFormData] = useState<SetupData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    venueName: 'The Nuthatch',
    venueSlug: 'the-nuthatch',
    venueEmail: '',
    venuePhone: '',
    venueAddress: '',
    resendApiKey: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Step 5: Store Resend API key
      const { error: settingsError } = await supabase
        .from('venue_settings')
        .insert({
          setting_key: 'resend_api_key',
          setting_value: formData.resendApiKey,
          venue_id: venue.id
        });

      if (settingsError) throw settingsError;

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
              </div>

              {/* Venue Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Venue Information</h3>
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
                    This will be used in booking URLs and email addresses: {formData.venueSlug}@grace-os.com
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

              {/* Email Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Email Configuration</h3>
                <div>
                  <Label htmlFor="resendApiKey">Resend API Key</Label>
                  <Input
                    id="resendApiKey"
                    type="password"
                    value={formData.resendApiKey}
                    onChange={(e) => handleInputChange('resendApiKey', e.target.value)}
                    placeholder="re_..."
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Get your API key from <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com/api-keys</a>
                  </p>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Email Setup</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Guest emails will be sent from:</strong> {formData.venueName} &lt;{formData.venueSlug}@grace-os.com&gt;</p>
                    <p><strong>Platform emails will be sent from:</strong> Grace OS &lt;noreply@grace-os.com&gt;</p>
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
