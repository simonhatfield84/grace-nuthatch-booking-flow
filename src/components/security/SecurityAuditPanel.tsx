import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSecurityAudit } from "@/hooks/useSecurityAudit";
import { Activity, RefreshCw, Search, Filter, Calendar, User, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function SecurityAuditPanel() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const { data: auditLogs, isLoading, refetch } = useSecurityAudit(timeRange);

  // Filter logs based on search term and event type
  const filteredLogs = auditLogs?.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(log.ip_address)?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEventType = eventTypeFilter === 'all' || log.event_type === eventTypeFilter;
    
    return matchesSearch && matchesEventType;
  }) || [];

  // Get unique event types for filter dropdown
  const eventTypes = [...new Set(auditLogs?.map(log => log.event_type) || [])];

  const getEventSeverity = (eventType: string) => {
    const critical = ['unauthorized_role_change_attempt', 'self_elevation_attempt', 'owner_demotion_attempt_blocked'];
    const high = ['venue_creation_unauthorized', 'direct_role_update_blocked'];
    const medium = ['venue_creation_rate_limit_exceeded', 'venue_creation_validation_failed'];
    
    if (critical.includes(eventType)) return { level: 'critical', color: 'destructive' };
    if (high.includes(eventType)) return { level: 'high', color: 'destructive' };
    if (medium.includes(eventType)) return { level: 'medium', color: 'default' };
    return { level: 'low', color: 'secondary' };
  };

  const formatEventDetails = (details: any) => {
    if (!details || typeof details !== 'object') return 'No details available';
    
    return Object.entries(details)
      .slice(0, 3) // Show only first 3 details to keep it concise
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Security Audit Log</span>
            </CardTitle>
            <CardDescription>
              Detailed log of all security-related events
            </CardDescription>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 text-sm border rounded-md bg-background"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events, users, or IP addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select 
              value={eventTypeFilter} 
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border rounded-md bg-background"
            >
              <option value="all">All Events</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Event Count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {filteredLogs.length} of {auditLogs?.length || 0} events</span>
        </div>

        {/* Audit Log Entries */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || eventTypeFilter !== 'all' 
              ? 'No events match your search criteria.' 
              : 'No security events found for the selected time range.'
            }
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredLogs.map((event, index) => {
              const severity = getEventSeverity(event.event_type);
              
              return (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant={severity.color as any}>
                        {severity.level}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">
                          {event.event_type.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatEventDetails(event.event_details)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(event.created_at), 'MMM dd, HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                    {event.user_id && (
                      <span className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>User: {event.user_id.slice(0, 8)}...</span>
                      </span>
                    )}
                    {event.ip_address && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>IP: {String(event.ip_address)}</span>
                      </span>
                    )}
                    {event.venue_id && (
                      <span>Venue: {event.venue_id.slice(0, 8)}...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}