
import { useEffect, useRef } from 'react';
import { useHomepageAnalytics } from '@/hooks/useHomepageAnalytics';

interface SectionTrackerProps {
  sectionName: string;
  children: React.ReactNode;
}

export const SectionTracker: React.FC<SectionTrackerProps> = ({ sectionName, children }) => {
  const { trackSectionView, isTrackingEnabled } = useHomepageAnalytics();
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!isTrackingEnabled || !sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Track when section becomes 50% visible
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !hasTracked.current) {
            trackSectionView(sectionName);
            hasTracked.current = true;
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of section is visible
        rootMargin: '0px',
      }
    );

    observer.observe(sectionRef.current);

    return () => {
      observer.disconnect();
    };
  }, [sectionName, trackSectionView, isTrackingEnabled]);

  return <div ref={sectionRef}>{children}</div>;
};
