
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
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        No audit trail available
      </div>
    );
  }

  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return <Badge variant="default" className="bg-green-100 text-green-800">Created</Badge>;
      case 'status_changed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Status</Badge>;
      case 'updated':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Updated</Badge>;
      default:
        return <Badge variant="secondary">{changeType}</Badge>;
    }
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
                  {format(new Date(entry.changed_at), 'MMM d, yyyy HH:mm')}
                </span>
              </div>
              
              {entry.field_name && (
                <div>
                  <span className="font-medium">{entry.field_name}:</span>
                  {entry.old_value && (
                    <span className="text-red-600 dark:text-red-400 ml-1">
                      {entry.old_value}
                    </span>
                  )}
                  {entry.old_value && entry.new_value && ' → '}
                  {entry.new_value && (
                    <span className="text-green-600 dark:text-green-400">
                      {entry.new_value}
                    </span>
                  )}
                </div>
              )}
              
              {entry.notes && (
                <div className="text-gray-600 dark:text-gray-300 italic">
                  {entry.notes}
                </div>
              )}
              
              {entry.changed_by && (
                <div className="text-gray-500 dark:text-gray-400">
                  by {entry.changed_by}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
