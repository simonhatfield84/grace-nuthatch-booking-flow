
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Wifi } from 'lucide-react';

interface FormData {
  fullName: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  marketingConsent: boolean;
}

interface OmadaParams {
  clientMac?: string;
  apMac?: string;
  ssidName?: string;
  radioId?: string;
  site?: string;
  originUrl?: string;
}

export const WifiPortal = () => {
  const { venueSlug } = useParams<{ venueSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    mobileNumber: '',
    dateOfBirth: '',
    marketingConsent: false
  });

  // Extract Omada parameters
  const omadaParams: OmadaParams = {
    clientMac: searchParams.get('clientMac') || undefined,
    apMac: searchParams.get('apMac') || undefined,
    ssidName: searchParams.get('ssidName') || undefined,
    radioId: searchParams.get('radioId') || undefined,
    site: searchParams.get('site') || undefined,
    originUrl: searchParams.get('originUrl') || undefined,
  };

  const isDebug = searchParams.get('debug') === 'true';

  // Fetch venue and WiFi settings
  const { data: venue, isLoading: venueLoading } = useQuery({
    queryKey: ['venue', venueSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          *,
          wifi_settings (*)
        `)
        .eq('slug', venueSlug)
        .eq('approval_status', 'approved')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!venueSlug,
  });

  const wifiSettings = venue?.wifi_settings?.[0];

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueSlug) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('wifi-portal-submit', {
        body: {
          venueSlug,
          formData,
          omadaParams,
          userAgent: navigator.userAgent,
          ipAddress: null // Will be captured server-side if needed
        }
      });

      if (error) throw error;

      if (data.success) {
        // Redirect to origin URL or success page
        if (data.origin_url) {
          window.location.href = data.origin_url;
        } else {
          navigate(`/wifiportal/success/${venueSlug}`);
        }
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Portal submission error:', error);
      alert('Failed to connect to WiFi. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (venueLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Venue Not Found</h1>
          <p>The WiFi portal for this venue is not available.</p>
        </div>
      </div>
    );
  }

  const logoUrl = wifiSettings?.logo_url || '/placeholder.svg';
  const backgroundUrl = wifiSettings?.background_image_url;
  const primaryColor = wifiSettings?.primary_color || '#2B3840';
  const secondaryColor = wifiSettings?.secondary_color || '#384140';
  const fontFamily = wifiSettings?.font_family || 'Playfair Display';
  const welcomeMessage = wifiSettings?.welcome_message || 'Welcome to Guest WiFi';
  const customCss = wifiSettings?.custom_css || '';

  const portalStyles = {
    '--primary-color': primaryColor,
    '--secondary-color': secondaryColor,
    fontFamily: fontFamily,
    backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  } as React.CSSProperties;

  return (
    <>
      {/* Google Fonts */}
      <link
        href={`https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}&display=swap`}
        rel="stylesheet"
      />
      
      {/* Custom CSS */}
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      <div 
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={portalStyles}
      >
        {/* Background overlay */}
        <div 
          className="absolute inset-0 bg-black/60"
          style={{ backgroundColor: `${primaryColor}E6` }}
        />
        
        <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardContent className="p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-16 w-auto mx-auto mb-4"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {welcomeMessage}
              </h1>
              {wifiSettings?.venue_description && (
                <p className="text-sm text-gray-600">
                  {wifiSettings.venue_description}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber" className="text-sm font-medium">
                  Mobile Number *
                </Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="marketingConsent"
                  checked={formData.marketingConsent}
                  onCheckedChange={(checked) => handleInputChange('marketingConsent', !!checked)}
                />
                <Label htmlFor="marketingConsent" className="text-sm">
                  I'd like to receive updates and offers from {venue.name}
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
                style={{ 
                  backgroundColor: primaryColor,
                  '--tw-bg-opacity': '1'
                } as React.CSSProperties}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-5 w-5" />
                    Connect to WiFi
                  </>
                )}
              </Button>
            </form>

            {wifiSettings?.terms_content && (
              <p className="text-xs text-gray-500 text-center mt-6 leading-relaxed">
                {wifiSettings.terms_content}
              </p>
            )}

            {/* Debug info */}
            {isDebug && (
              <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
                <h3 className="font-bold mb-2">Debug Info:</h3>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(omadaParams, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};
