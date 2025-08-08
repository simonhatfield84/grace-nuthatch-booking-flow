
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useVenueBySlug } from '@/hooks/useVenueBySlug';
import { WifiPortalFlow } from '@/components/wifi/WifiPortalFlow';
import { Loader2 } from 'lucide-react';

const WifiPortal: React.FC = () => {
  const { venueSlug } = useParams<{ venueSlug: string }>();
  // Default to 'nuthatch' if no slug is provided (for The Nuthatch setup)
  const { data: venue, isLoading } = useVenueBySlug(venueSlug || 'nuthatch');
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('');

  useEffect(() => {
    // Generate device fingerprint
    const generateFingerprint = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        const canvasData = canvas.toDataURL();
        
        const fingerprint = btoa(
          navigator.userAgent + 
          screen.width + 
          screen.height + 
          new Date().getTimezoneOffset() + 
          navigator.language + 
          canvasData.slice(-50)
        ).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
        
        setDeviceFingerprint(fingerprint);
      }
    };

    generateFingerprint();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Venue Not Found</h1>
          <p className="text-muted-foreground">The requested WiFi portal could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <WifiPortalFlow venue={venue} deviceFingerprint={deviceFingerprint} />
    </div>
  );
};

export default WifiPortal;
