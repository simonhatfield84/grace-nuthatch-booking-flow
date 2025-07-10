
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface SecurityAuditEvent {
  id: string;
  event_type: string;
  event_details: any;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function SecurityAuditPanel() {
  const { data: auditEvents = [], isLoading } = useQuery({
    queryKey: ['security-audit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Failed to fetch security audit events:', error);
        throw error;
      }

      return data as SecurityAuditEvent[];
    },
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
      case 'webhook_received':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'login_failure':
      case 'permission_denied':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'login_attempt':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Shield className="h-4 w-4 text-blue-600" />;
    }
  };

  const getEventBadge = (eventType: string) => {
    const severity = getSeverity(eventType);
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
      info: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={colors[severity]}>
        {eventType.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getSeverity = (eventType: string): 'high' | 'medium' | 'low' | 'info' => {
    switch (eventType) {
      case 'permission_denied':
      case 'login_failure':
        return 'high';
      case 'login_attempt':
        return 'medium';
      case 'login_success':
        return 'low';
      default:
        return 'info';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Audit Log
        </CardTitle>
        <CardDescription>
          Recent security events and system activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.event_type)}
                      <span className="font-medium">
                        {event.event_details?.details || 'Security event'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getEventBadge(event.event_type)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {event.user_id ? `User: ${event.user_id.substring(0, 8)}...` : 'Anonymous'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">
                      {event.ip_address || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
