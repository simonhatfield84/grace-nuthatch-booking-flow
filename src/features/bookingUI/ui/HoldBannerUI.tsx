import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock } from 'lucide-react';

interface HoldBannerUIProps {
  secondsRemaining?: number;
  className?: string;
}

export function HoldBannerUI({ secondsRemaining = 300, className }: HoldBannerUIProps) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isUrgent = secondsRemaining < 60;

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
