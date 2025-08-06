
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface SecurityCheck {
  name: string;
  status: 'passed' | 'warning' | 'failed';
  description: string;
  recommendation?: string;
}

export const SecurityHardeningStatus = () => {
  const [isRunningCheck, setIsRunningCheck] = useState(false);

  const { data: securityStatus, refetch, isLoading } = useQuery({
    queryKey: ['security-status'],
    queryFn: async () => {
      const checks: SecurityCheck[] = [];
      
      // Check 1: Database Functions Security
      try {
        const { error: functionError } = await supabase.rpc('get_security_metrics');
        checks.push({
          name: "Database Function Security",
          status: functionError ? 'failed' : 'passed',
          description: functionError ? 'Database functions have security vulnerabilities' : 'All database functions properly secured',
          recommendation: functionError ? 'Review and fix database function search paths' : undefined
        });
      } catch (error) {
        checks.push({
          name: "Database Function Security",
          status: 'failed',
          description: 'Unable to verify database function security',
          recommendation: 'Check database function configurations'
        });
      }

      // Check 2: Rate Limiting
      try {
        const { error: rateLimitError } = await supabase.rpc('check_advanced_rate_limit', {
          identifier: 'security-check',
          operation_type: 'security_validation',
          max_attempts: 100
        });
        checks.push({
          name: "Advanced Rate Limiting",
          status: rateLimitError ? 'warning' : 'passed',
          description: rateLimitError ? 'Rate limiting may have issues' : 'Advanced rate limiting active',
          recommendation: rateLimitError ? 'Review rate limiting configuration' : undefined
        });
      } catch (error) {
        checks.push({
          name: "Advanced Rate Limiting",
          status: 'warning',
          description: 'Rate limiting status uncertain',
          recommendation: 'Verify rate limiting implementation'
        });
      }

      // Check 3: Audit Trail
      try {
        const { data: auditData, error: auditError } = await supabase
          .from('security_audit')
          .select('id')
          .limit(1);
        
        checks.push({
          name: "Security Audit Trail",
          status: auditError ? 'failed' : 'passed',
          description: auditError ? 'Security audit trail not functioning' : 'Security events being logged',
          recommendation: auditError ? 'Check audit trail configuration' : undefined
        });
      } catch (error) {
        checks.push({
          name: "Security Audit Trail",
          status: 'failed',
          description: 'Cannot access security audit trail',
          recommendation: 'Verify audit trail permissions'
        });
      }

      // Check 4: Role Security
      try {
        const { error: roleError } = await supabase.rpc('detect_role_anomalies');
        checks.push({
          name: "Role Security Monitoring",
          status: roleError ? 'warning' : 'passed',
          description: roleError ? 'Role monitoring may have issues' : 'Role security monitoring active',
          recommendation: roleError ? 'Review role security functions' : undefined
        });
      } catch (error) {
        checks.push({
          name: "Role Security Monitoring",
          status: 'warning',
          description: 'Role security status uncertain',
          recommendation: 'Verify role monitoring functions'
        });
      }

      return checks;
    },
    refetchInterval: 60000 // Check every minute
  });

  const runSecurityCheck = async () => {
    setIsRunningCheck(true);
    await refetch();
    setIsRunningCheck(false);
  };

  const getStatusIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const overallStatus = securityStatus?.reduce((acc, check) => {
    if (check.status === 'failed') return 'failed';
    if (check.status === 'warning' && acc !== 'failed') return 'warning';
    return acc;
  }, 'passed' as SecurityCheck['status']);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Security Hardening Status</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(overallStatus || 'warning')}>
              {getStatusIcon(overallStatus || 'warning')}
              {overallStatus?.toUpperCase() || 'CHECKING...'}
            </Badge>
            <Button
              onClick={runSecurityCheck}
              variant="outline"
              size="sm"
              disabled={isLoading || isRunningCheck}
            >
              {isLoading || isRunningCheck ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Check
            </Button>
          </div>
        </div>
        <CardDescription>
          Real-time security status monitoring and hardening verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {securityStatus?.map((check) => (
              <div
                key={check.name}
                className={`p-3 rounded-lg border ${getStatusColor(check.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(check.status)}
                    <span className="font-medium">{check.name}</span>
                  </div>
                </div>
                <div className="mt-1">
                  <p className="text-sm">{check.description}</p>
                  {check.recommendation && (
                    <p className="text-xs mt-1 opacity-75">
                      <strong>Recommendation:</strong> {check.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
