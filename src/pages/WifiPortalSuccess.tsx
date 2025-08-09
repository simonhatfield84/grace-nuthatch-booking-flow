
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, ExternalLink } from 'lucide-react';

export const WifiPortalSuccess = () => {
  const { venueSlug } = useParams<{ venueSlug: string }>();

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
  const fontFamily = wifiSettings?.font_family || 'Playfair Display';

  const portalStyles = {
    '--primary-color': primaryColor,
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
          <CardContent className="p-8 text-center">
            {/* Logo */}
            <img
              src={logoUrl}
              alt="Logo"
              className="h-16 w-auto mx-auto mb-6"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />

            {/* Success icon */}
            <div className="mb-6">
              <CheckCircle 
                className="h-16 w-16 mx-auto text-green-500 mb-4" 
              />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                You're now connected!
              </h1>
              <p className="text-lg text-gray-600">
                Enjoy your visit to {venue.name}
              </p>
            </div>

            {/* Brand message */}
            <div className="mb-8">
              <p className="text-gray-700 mb-4">
                While you're here, why not explore our cocktail list or book your next visit?
              </p>
              
              {/* The Nuthatch specific link */}
              {venueSlug === 'nuthatch' && (
                <Button
                  asChild
                  className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
                  style={{ 
                    backgroundColor: primaryColor,
                    '--tw-bg-opacity': '1'
                  } as React.CSSProperties}
                >
                  <a 
                    href="https://the-nuthatch.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center"
                  >
                    View Menu
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>

            <p className="text-sm text-gray-500">
              You can now close this window and enjoy browsing the web.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
