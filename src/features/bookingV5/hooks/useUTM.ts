import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export function useUTM() {
  const [searchParams] = useSearchParams();
  const [utm, setUTM] = useState<UTMParams>({});
  
  useEffect(() => {
    const utmData: UTMParams = {
      utm_source: searchParams.get('utm_source') || undefined,
      utm_medium: searchParams.get('utm_medium') || undefined,
      utm_campaign: searchParams.get('utm_campaign') || undefined,
      utm_content: searchParams.get('utm_content') || undefined,
      utm_term: searchParams.get('utm_term') || undefined,
    };
    
    // Remove undefined values
    const cleanedUTM = Object.fromEntries(
      Object.entries(utmData).filter(([_, v]) => v !== undefined)
    ) as UTMParams;
    
    setUTM(cleanedUTM);
    
    // Store in sessionStorage for persistence across steps
    if (Object.keys(cleanedUTM).length > 0) {
      sessionStorage.setItem('v5_utm', JSON.stringify(cleanedUTM));
    }
  }, [searchParams]);
  
  // Also check sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('v5_utm');
    if (stored && Object.keys(utm).length === 0) {
      try {
        setUTM(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored UTM:', e);
      }
    }
  }, []);
  
  return utm;
}
