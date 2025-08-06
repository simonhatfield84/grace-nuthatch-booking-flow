
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePlatformSettingsV2, useUpdatePlatformSettingsV2 } from '@/hooks/usePlatformSettingsV2';
import { emailSettingsSchema, EmailSettingsData } from '@/lib/validations/platformSettings';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const EmailSettingsTab = () => {
  const { data: settings, isLoading } = usePlatformSettingsV2();
  const updateSettings = useUpdatePlatformSettingsV2();

  const form = useForm<EmailSettingsData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtp_host: '',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      from_email: 'nuthatch@grace-os.co.uk', // Set default to correct domain
      from_name: 'Grace OS',
      email_signature: '',
      email_logo_url: '',
      email_primary_color: '#000000',
      email_secondary_color: '#64748b',
    },
  });

  React.useEffect(() => {
    if (settings) {
      form.reset({
        smtp_host: settings.smtp_host || '',
        smtp_port: settings.smtp_port || 587,
        smtp_username: settings.smtp_username || '',
        smtp_password: settings.smtp_password || '',
        from_email: settings.from_email || 'nuthatch@grace-os.co.uk', // Default to correct domain
        from_name: settings.from_name || 'Grace OS',
        email_signature: settings.email_signature || '',
        email_logo_url: settings.email_logo_url || '',
        email_primary_color: settings.email_primary_color || '#000000',
        email_secondary_color: settings.email_secondary_color || '#64748b',
      });
    }
  }, [settings, form]);

  const onSubmit = (data: EmailSettingsData) => {
    updateSettings.mutate(data);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const currentFromEmail = settings?.from_email;
  const isUsingWrongDomain = currentFromEmail && currentFromEmail.includes('graceplatform.com');

  return (
    <div className="space-y-6">
      {isUsingWrongDomain && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your current from email uses an unverified domain (graceplatform.com). Please update it to use grace-os.co.uk and verify this domain in Resend.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
          <CardDescription>
            Configure how emails are sent from your platform. Make sure to verify your domain in Resend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="from_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email" 
                          placeholder="nuthatch@grace-os.co.uk"
                          className={isUsingWrongDomain ? 'border-destructive' : ''}
                        />
                      </FormControl>
                      <FormMessage />
                      {field.value && field.value.includes('graceplatform.com') && (
                        <p className="text-sm text-destructive">
                          This domain is not verified in Resend. Please use grace-os.co.uk
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="from_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Grace OS" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">SMTP Settings (Optional)</h3>
                <p className="text-sm text-muted-foreground">
                  Configure custom SMTP settings. If not provided, platform defaults will be used.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="smtp_host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Host</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="smtp.resend.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smtp_port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Port</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            placeholder="587"
                            onChange={e => field.onChange(parseInt(e.target.value) || 587)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smtp_username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Username</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="resend" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smtp_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Your API key" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Branding</h3>
                
                <FormField
                  control={form.control}
                  name="email_signature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Signature</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Best regards,&#10;The Grace OS Team"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email_logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Logo URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/logo.png" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email_primary_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <FormControl>
                          <Input {...field} type="color" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email_secondary_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Color</FormLabel>
                        <FormControl>
                          <Input {...field} type="color" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateSettings.isPending}>
                  {updateSettings.isPending ? 'Saving...' : 'Save Email Settings'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domain Verification Status</CardTitle>
          <CardDescription>
            Make sure your email domain is verified in Resend for emails to be delivered.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>grace-os.co.uk</span>
              <Badge variant="outline">Verify in Resend</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Go to <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Resend Domains
              </a> to add and verify this domain.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
