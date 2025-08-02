
import { useEffect, useRef } from 'react';
import { useHomepageAnalytics } from '@/hooks/useHomepageAnalytics';

export const BounceTracker: React.FC = () => {
  const { trackBounce, trackExit, isTrackingEnabled } = useHomepageAnalytics();
  const bounceTimerRef = useRef<NodeJS.Timeout>();
  const hasInteracted = useRef(false);
  const hasBounced = useRef(false);

  useEffect(() => {
    if (!isTrackingEnabled) return;

    // Track interactions to detect if user is engaged
    const handleInteraction = () => {
      hasInteracted.current = true;
      if (bounceTimerRef.current) {
        clearTimeout(bounceTimerRef.current);
      }
    };

    // Set bounce timer for 30 seconds
    bounceTimerRef.current = setTimeout(() => {
      if (!hasInteracted.current && !hasBounced.current) {
        trackBounce();
        hasBounced.current = true;
      }
    }, 30000); // 30 seconds

    // Add event listeners for user interactions
    const events = ['click', 'scroll', 'keypress', 'mousemove', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true });
    });

    // Track exit when user leaves
    const handleBeforeUnload = () => {
      if (!hasBounced.current) {
        trackExit();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (bounceTimerRef.current) {
        clearTimeout(bounceTimerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [trackBounce, trackExit, isTrackingEnabled]);

  return null; // This component doesn't render anything
};
