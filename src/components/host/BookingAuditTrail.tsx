
import { useBookingAudit } from "@/hooks/useBookingAudit";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Mail, MailX, Clock, User, Globe, Smartphone } from "lucide-react";

interface BookingAuditTrailProps {
  bookingId: number;
}

export const BookingAuditTrail = ({ bookingId }: BookingAuditTrailProps) => {
  const { auditTrail } = useBookingAudit(bookingId);

  if (auditTrail.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Audit Trail</h4>
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          No audit trail available
        </div>
      </div>
    );
  }

  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Created</Badge>;
      case 'status_changed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">Status</Badge>;
      case 'table_changed':
        return <Badge variant="default" className="bg-purple-100 text-purple-800 text-xs">Table</Badge>;
      case 'time_changed':
        return <Badge variant="default" className="bg-orange-100 text-orange-800 text-xs">Time</Badge>;
      case 'updated':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 text-xs">Updated</Badge>;
      case 'email_sent':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800 text-xs">Email Sent</Badge>;
      case 'email_failed':
        return <Badge variant="default" className="bg-red-100 text-red-800 text-xs">Email Failed</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{changeType}</Badge>;
    }
  };

  const getEmailStatusIcon = (emailStatus: string | null) => {
    if (!emailStatus) return null;
    
    switch (emailStatus) {
      case 'sent':
        return <Mail className="w-3 h-3 text-green-600" />;
      case 'failed':
        return <MailX className="w-3 h-3 text-red-600" />;
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getSourceIcon = (sourceType: string | null) => {
    if (!sourceType) return <User className="w-3 h-3 text-gray-500" />;
    
    switch (sourceType) {
      case 'guest_via_widget':
        return <Globe className="w-3 h-3 text-blue-600" />;
      case 'host_via_interface':
        return <User className="w-3 h-3 text-purple-600" />;
      case 'host_via_phone':
        return <Smartphone className="w-3 h-3 text-orange-600" />;
      case 'system_automatic':
        return <Clock className="w-3 h-3 text-gray-600" />;
      default:
        return <User className="w-3 h-3 text-gray-500" />;
    }
  };

  const formatChangedBy = (changedBy: string | null, sourceType: string | null) => {
    if (!changedBy) return 'System';
    if (changedBy === 'guest') return 'Guest';
    if (sourceType === 'guest_via_widget') return 'Guest via Booking Widget';
    if (sourceType === 'host_via_phone') return `${changedBy} (Phone Booking)`;
    return changedBy;
  };

  const formatSourceDetails = (sourceDetails: Record<string, any>) => {
    if (!sourceDetails || Object.keys(sourceDetails).length === 0) return null;
    
    const details = [];
    if (sourceDetails.ip_address) {
      details.push(`IP: ${sourceDetails.ip_address}`);
    }
    if (sourceDetails.user_agent) {
      const userAgent = sourceDetails.user_agent.split(' ')[0]; // Just first part for brevity
      details.push(`Device: ${userAgent}`);
    }
    if (sourceDetails.interface_type) {
      details.push(`Interface: ${sourceDetails.interface_type}`);
    }
    if (sourceDetails.threat_level) {
      details.push(`Security: ${sourceDetails.threat_level} risk`);
    }
    
    return details.length > 0 ? details.join(' • ') : null;
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Audit Trail</h4>
      <ScrollArea className="h-48">
        <div className="space-y-2">
          {auditTrail.map((entry) => (
            <div key={entry.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getChangeTypeBadge(entry.change_type)}
                  {entry.email_status && getEmailStatusIcon(entry.email_status)}
                </div>
                <span className="text-gray-500 dark:text-gray-400">
                  {format(new Date(entry.changed_at), 'MMM d, HH:mm')}
                </span>
              </div>
              
              {entry.field_name && (
                <div className="space-y-1">
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {entry.field_name}:
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.old_value && (
                      <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                        {entry.old_value}
                      </span>
                    )}
                    {entry.old_value && entry.new_value && (
                      <span className="text-gray-400">→</span>
                    )}
                    {entry.new_value && (
                      <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                        {entry.new_value}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {entry.notes && (
                <div className="text-gray-600 dark:text-gray-300 italic mt-1">
                  "{entry.notes}"
                </div>
              )}

              {/* Email notification details */}
              {entry.email_status && entry.notification_details && Object.keys(entry.notification_details).length > 0 && (
                <div className="text-gray-600 dark:text-gray-300 mt-1 p-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {entry.notification_details.email_type && (
                    <div>Email: {entry.notification_details.email_type}</div>
                  )}
                  {entry.notification_details.error_message && (
                    <div className="text-red-600">Error: {entry.notification_details.error_message}</div>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                {getSourceIcon(entry.source_type)}
                <span>by {formatChangedBy(entry.changed_by, entry.source_type)}</span>
              </div>

              {/* Source details */}
              {formatSourceDetails(entry.source_details) && (
                <div className="text-gray-500 dark:text-gray-400 text-xs mt-1 pl-5">
                  {formatSourceDetails(entry.source_details)}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
