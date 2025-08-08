
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { WifiPortalFlow } from '@/components/wifi/WifiPortalFlow';
import { useVenueBySlug } from '@/hooks/useVenueBySlug';
import { Loader2 } from 'lucide-react';

export default function WifiPortal() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { data: venue, isLoading, error } = useVenueBySlug(slug || '');
  
  const sessionToken = searchParams.get('token');
  const deviceFingerprint = searchParams.get('device') || generateDeviceFingerprint();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">WiFi Portal Not Found</h1>
          <p className="text-muted-foreground">The WiFi portal for this venue could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <WifiPortalFlow 
        venue={venue} 
        sessionToken={sessionToken}
        deviceFingerprint={deviceFingerprint}
      />
    </div>
  );
}

function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Device fingerprint', 10, 50);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas.toDataURL()
  ].join('|');
  
  return btoa(fingerprint).substring(0, 32);
}
