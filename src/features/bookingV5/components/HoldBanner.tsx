import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { differenceInSeconds } from 'date-fns';

interface HoldBannerProps {
  expiresAt: string;
  onExpired: () => void;
  copy?: {
    title?: string;
    subtitle?: string;
    urgentWarning?: string;
  };
}

const DEFAULT_COPY = {
  title: "We're holding your table",
  subtitle: "Complete your details within {time}, or the hold releases automatically.",
  urgentWarning: "⏰ Complete your booking soon!"
};

export function HoldBanner({ expiresAt, onExpired, copy }: HoldBannerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const expires = new Date(expiresAt);
      const now = new Date();
      const seconds = differenceInSeconds(expires, now);
      
      if (seconds <= 0) {
        onExpired();
        return 0;
      }
      
      return seconds;
    };
    
    setTimeLeft(calculateTimeLeft());
    
    const interval = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      
      if (left <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  const isUrgent = timeLeft < 60;
  
  const title = copy?.title || DEFAULT_COPY.title;
  const subtitle = (copy?.subtitle || DEFAULT_COPY.subtitle).replace('{time}', timeFormatted);
  const urgentWarning = copy?.urgentWarning || DEFAULT_COPY.urgentWarning;
  
  return (
    <div className={`
      relative overflow-hidden rounded-lg p-6
      ${isUrgent 
        ? 'bg-gradient-to-r from-destructive/20 via-destructive/10 to-orange-500/10 border-2 border-destructive' 
        : 'bg-gradient-to-r from-primary/20 via-emerald-500/10 to-teal-500/10 border-2 border-primary'
      }
      ${isUrgent ? 'animate-pulse' : ''}
    `}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${isUrgent ? 'text-destructive' : 'text-primary'}`} />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
          {isUrgent && (
            <p className="text-sm font-medium text-destructive mt-2">
              {urgentWarning}
            </p>
          )}
        </div>
        <div className={`
          text-right flex-shrink-0
          ${isUrgent ? 'text-destructive' : 'text-primary'}
        `}>
          <div className="text-3xl font-bold tabular-nums">
            {timeFormatted}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            remaining
          </div>
        </div>
      </div>
    </div>
  );
}
