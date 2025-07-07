
import { useBookingAudit } from "@/hooks/useBookingAudit";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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
      default:
        return <Badge variant="secondary" className="text-xs">{changeType}</Badge>;
    }
  };

  const formatChangedBy = (changedBy: string | null) => {
    if (!changedBy) return 'System';
    if (changedBy === 'guest') return 'Guest';
    return changedBy; // This would be the user's name/email
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Audit Trail</h4>
      <ScrollArea className="h-48">
        <div className="space-y-2">
          {auditTrail.map((entry) => (
            <div key={entry.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs space-y-1">
              <div className="flex items-center justify-between">
                {getChangeTypeBadge(entry.change_type)}
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
              
              <div className="text-gray-500 dark:text-gray-400 mt-1">
                by {formatChangedBy(entry.changed_by)}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
