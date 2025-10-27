import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HoldBannerUIProps {
  className?: string;
}

export function HoldBannerUI({ className }: HoldBannerUIProps) {
  // Mock countdown starting at 5:00
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 60;

  return (
    <Alert 
      variant={isUrgent ? "destructive" : "default"} 
      className={className}
    >
      <Clock className="h-4 w-4" />
      <AlertDescription>
        We're holding your table for{' '}
        <strong>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </strong>
      </AlertDescription>
    </Alert>
  );
}
