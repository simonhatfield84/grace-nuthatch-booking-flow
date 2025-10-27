import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StepCardProps {
  children: ReactNode;
  className?: string;
}

export function StepCard({ children, className }: StepCardProps) {
  return (
    <Card className={cn("border rounded-lg shadow-sm bg-white", className)}>
      {children}
    </Card>
  );
}
