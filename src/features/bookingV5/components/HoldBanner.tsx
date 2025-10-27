import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { differenceInSeconds } from 'date-fns';

interface HoldBannerProps {
  expiresAt: string;
  onExpired: () => void;
}

export function HoldBanner({ expiresAt, onExpired }: HoldBannerProps) {
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
  
  const isUrgent = timeLeft < 60;
  
  return (
    <Alert className={isUrgent ? 'border-destructive bg-destructive/10' : 'border-primary bg-primary/10'}>
      <Clock className={`h-4 w-4 ${isUrgent ? 'text-destructive' : 'text-primary'}`} />
      <AlertDescription>
        <span className="font-semibold">Time slot held:</span> {minutes}:{seconds.toString().padStart(2, '0')} remaining
        {isUrgent && <span className="ml-2 text-destructive">⚠️ Complete booking soon!</span>}
      </AlertDescription>
    </Alert>
  );
}
