
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Lock } from 'lucide-react';
import { useSecurityMetrics } from '@/hooks/useSecurityMetrics';

export const SecurityAlertsBanner: React.FC = () => {
  const { systemHealth, roleAnomalies, isLoading } = useSecurityMetrics();

  if (isLoading) return null;

  const criticalAlerts = [];
  
  // Check for high-risk security events
  if (systemHealth && systemHealth.health_score < 70) {
    criticalAlerts.push({
      type: 'critical',
      message: `Security health score is ${systemHealth.health_score}/100`,
      icon: AlertTriangle
    });
  }

  if (systemHealth && systemHealth.failed_logins_last_hour > 10) {
    criticalAlerts.push({
      type: 'warning',
      message: `${systemHealth.failed_logins_last_hour} failed login attempts in the last hour`,
      icon: Lock
    });
  }

  if (roleAnomalies && roleAnomalies.length > 0) {
    criticalAlerts.push({
      type: 'critical',
      message: `${roleAnomalies.length} role-related security anomalies detected`,
      icon: Shield
    });
  }

  if (criticalAlerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {criticalAlerts.map((alert, index) => {
        const IconComponent = alert.icon;
        return (
          <Alert 
            key={index}
            className={
              alert.type === 'critical' 
                ? 'bg-red-950 border-red-800 text-red-200'
                : 'bg-orange-950 border-orange-800 text-orange-200'
            }
          >
            <IconComponent className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {alert.message}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
};
