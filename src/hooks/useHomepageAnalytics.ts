
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Generate anonymous visitor ID (persists across sessions)
const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('grace_visitor_id');
  if (!visitorId) {
    visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('grace_visitor_id', visitorId);
  }
  return visitorId;
};

// Generate session ID (unique per session)
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('grace_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem('grace_session_id', sessionId);
  }
  return sessionId;
};

// Check if user has Do Not Track enabled
const isDNTEnabled = (): boolean => {
  return navigator.doNotTrack === '1' || 
         (window as any).doNotTrack === '1' || 
         (navigator as any).msDoNotTrack === '1';
};

interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
}

export const useHomepageAnalytics = () => {
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const sessionStartTime = useRef<number>(Date.now());
  const visitorId = useRef<string>('');
  const sessionId = useRef<string>('');

  useEffect(() => {
    // Check if tracking should be enabled
    const trackingEnabled = !isDNTEnabled();
    setIsTrackingEnabled(trackingEnabled);

    if (trackingEnabled) {
      visitorId.current = getVisitorId();
      sessionId.current = getSessionId();
    }
  }, []);

  const trackEvent = async (event: AnalyticsEvent) => {
    if (!isTrackingEnabled) return;

    try {
      await supabase.from('homepage_analytics').insert({
        visitor_id: visitorId.current,
        session_id: sessionId.current,
        event_type: event.event_type,
        event_data: event.event_data || {},
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  const trackPageView = () => {
    trackEvent({
      event_type: 'page_view',
      event_data: {
        url: window.location.href,
        title: document.title,
      }
    });
  };

  const trackSectionView = (sectionName: string) => {
    trackEvent({
      event_type: 'section_view',
      event_data: {
        section_name: sectionName,
        scroll_position: window.scrollY,
      }
    });
  };

  const trackBounce = () => {
    const sessionDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    trackEvent({
      event_type: 'bounce',
      event_data: {
        duration_seconds: sessionDuration,
      }
    });
  };

  const trackExit = () => {
    const sessionDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    trackEvent({
      event_type: 'exit',
      event_data: {
        duration_seconds: sessionDuration,
      }
    });
  };

  return {
    isTrackingEnabled,
    trackPageView,
    trackSectionView,
    trackBounce,
    trackExit,
  };
};
