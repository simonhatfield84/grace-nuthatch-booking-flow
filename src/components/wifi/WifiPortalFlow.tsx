
import React, { useState, useEffect } from 'react';
import { WelcomeStep } from './WelcomeStep';
import { GuestDetailsStep } from './GuestDetailsStep';
import { TermsStep } from './TermsStep';
import { SuccessStep } from './SuccessStep';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Guest } from '@/types/guest';

interface Venue {
  id: string;
  name: string;
  slug: string;
  phone?: string;
  address?: string;
  email?: string;
}

interface WifiPortalFlowProps {
  venue: Venue;
  sessionToken?: string | null;
  deviceFingerprint: string;
}

export type PortalStep = 'welcome' | 'details' | 'terms' | 'success';

export interface GuestFormData {
  name: string;
  email: string;
  phone: string;
  marketing_consent: boolean;
  terms_accepted: boolean;
}

export function WifiPortalFlow({ venue, sessionToken, deviceFingerprint }: WifiPortalFlowProps) {
  const [currentStep, setCurrentStep] = useState<PortalStep>('welcome');
  const [guestData, setGuestData] = useState<Partial<GuestFormData>>({});
  const [existingGuest, setExistingGuest] = useState<Guest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wifiCredentials, setWifiCredentials] = useState<{
    network: string;
    password: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Track initial connection analytics
    trackConnection();
  }, []);

  const trackConnection = async () => {
    try {
      const deviceInfo = getDeviceInfo();
      await supabase.functions.invoke('wifi-portal-signup', {
        body: {
          action: 'track_connection',
          venue_id: venue.id,
          device_fingerprint: deviceFingerprint,
          device_info: deviceInfo
        }
      });
    } catch (error) {
      console.error('Failed to track connection:', error);
    }
  };

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let deviceType = 'desktop';
    
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      deviceType = 'tablet';
    } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
      deviceType = 'mobile';
    }

    return {
      type: deviceType,
      os: navigator.platform,
      browser: getBrowserName(),
      user_agent: ua,
      screen_resolution: `${screen.width}x${screen.height}`
    };
  };

  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const handleStepComplete = async (stepData: any) => {
    setIsLoading(true);
    
    try {
      switch (currentStep) {
        case 'welcome':
          // Check for existing guest by device fingerprint
          const { data: existingDevice } = await supabase
            .from('wifi_devices')
            .select(`
              guest_id,
              guests (*)
            `)
            .eq('venue_id', venue.id)
            .eq('device_fingerprint', deviceFingerprint)
            .single();

          if (existingDevice?.guests) {
            setExistingGuest(existingDevice.guests as Guest);
            setCurrentStep('success');
            await grantWifiAccess(existingDevice.guests as Guest);
          } else {
            setCurrentStep('details');
          }
          break;

        case 'details':
          setGuestData(stepData);
          
          // Check for duplicate guests
          const duplicates = await checkForDuplicates(stepData.email, stepData.phone);
          if (duplicates.length > 0) {
            // Convert duplicate guest to proper Guest type
            const duplicateGuest: Guest = {
              id: duplicates[0].id,
              name: duplicates[0].name,
              email: duplicates[0].email,
              phone: duplicates[0].phone,
              opt_in_marketing: false,
              notes: null,
              created_at: duplicates[0].created_at,
              updated_at: duplicates[0].created_at
            };
            setExistingGuest(duplicateGuest);
            await grantWifiAccess(duplicateGuest);
            setCurrentStep('success');
          } else {
            setCurrentStep('terms');
          }
          break;

        case 'terms':
          if (stepData.terms_accepted) {
            const finalGuestData = { ...guestData, ...stepData };
            const newGuest = await createGuestAndGrantAccess(finalGuestData as GuestFormData);
            setExistingGuest(newGuest);
            setCurrentStep('success');
          }
          break;
      }
    } catch (error) {
      console.error('Step completion error:', error);
      toast({
        title: "Connection Error",
        description: "There was a problem connecting to WiFi. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkForDuplicates = async (email: string, phone: string) => {
    try {
      const { data, error } = await supabase.rpc('find_duplicate_guests', {
        guest_email: email || null,
        guest_phone: phone || null
      });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return [];
    }
  };

  const createGuestAndGrantAccess = async (formData: GuestFormData): Promise<Guest> => {
    const { data, error } = await supabase.functions.invoke('wifi-portal-signup', {
      body: {
        action: 'create_guest',
        venue_id: venue.id,
        device_fingerprint: deviceFingerprint,
        guest_data: formData,
        device_info: getDeviceInfo()
      }
    });

    if (error) throw error;
    
    setWifiCredentials(data.wifi_credentials);
    return data.guest;
  };

  const grantWifiAccess = async (guest: Guest) => {
    const { data, error } = await supabase.functions.invoke('wifi-portal-signup', {
      body: {
        action: 'grant_access',
        venue_id: venue.id,
        device_fingerprint: deviceFingerprint,
        guest_id: guest.id,
        device_info: getDeviceInfo()
      }
    });

    if (error) throw error;
    setWifiCredentials(data.wifi_credentials);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <WelcomeStep 
            venue={venue} 
            onContinue={() => handleStepComplete({})}
            isLoading={isLoading}
          />
        );
      case 'details':
        return (
          <GuestDetailsStep 
            venue={venue}
            onSubmit={handleStepComplete}
            isLoading={isLoading}
          />
        );
      case 'terms':
        return (
          <TermsStep 
            venue={venue}
            guestData={guestData}
            onAccept={handleStepComplete}
            onBack={() => setCurrentStep('details')}
            isLoading={isLoading}
          />
        );
      case 'success':
        return (
          <SuccessStep 
            venue={venue}
            guest={existingGuest}
            wifiCredentials={wifiCredentials}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {renderStep()}
    </div>
  );
}
