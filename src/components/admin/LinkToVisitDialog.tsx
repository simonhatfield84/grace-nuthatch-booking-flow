import { useState } from "react";
import { format, addHours, subHours } from "date-fns";
import { OrderLinkReview } from "@/types/square";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Link2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LinkToVisitDialogProps {
  review: OrderLinkReview;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkToVisitDialog({ review, open, onClose, onSuccess }: LinkToVisitDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("visits");
  const [linking, setLinking] = useState(false);
  const { toast } = useToast();

  const snapshot = review.snapshot || {};
  const orderTime = snapshot.opened_at ? new Date(snapshot.opened_at) : new Date();
  const locationId = snapshot.location_id;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(cents / 100);
  };

  // Query 1: Resolve venue from location
  const { data: venueId } = useQuery({
    queryKey: ['venue-from-location', locationId],
    queryFn: async () => {
      if (!locationId) return null;
      const { data } = await supabase
        .from('square_location_map')
        .select('grace_venue_id')
        .eq('square_location_id', locationId)
        .single();
      return data?.grace_venue_id || null;
    },
    enabled: open && !!locationId
  });

  // Query 2: Seated visits within ±3 hours
  const { data: visits, isLoading: visitsLoading } = useQuery({
    queryKey: ['seated-visits', venueId, orderTime.toISOString(), searchQuery],
    queryFn: async () => {
      if (!venueId) return [];
      
      const startTime = subHours(orderTime, 3);
      const endTime = addHours(orderTime, 3);
      const orderDate = format(orderTime, 'yyyy-MM-dd');
      
      let query = supabase
        .from('bookings')
        .select('id, guest_name, party_size, booking_time, status, table_id, tables(label, section_id, sections(name))')
        .eq('venue_id', venueId)
        .eq('booking_date', orderDate)
        .in('status', ['confirmed', 'seated', 'finished'])
        .gte('booking_time', format(startTime, 'HH:mm:ss'))
        .lte('booking_time', format(endTime, 'HH:mm:ss'))
        .order('booking_time', { ascending: true });
      
      if (searchQuery) {
        query = query.ilike('guest_name', `%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!venueId
  });

  // Query 3: Available tables
  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['available-tables', venueId, searchQuery],
    queryFn: async () => {
      if (!venueId) return [];
      
      let query = supabase
        .from('tables')
        .select('id, label, seats, status, section_id, sections(id, name, color)')
        .eq('venue_id', venueId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('section_id', { ascending: true })
        .order('label', { ascending: true });
      
      if (searchQuery) {
        query = query.ilike('label', `%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!venueId
  });

  const handleLinkToVisit = async (booking: any) => {
    setLinking(true);
    try {
      const { error } = await supabase.rpc('resolve_order_review', {
        p_review_id: review.id,
        p_action: 'link_to_visit',
        p_visit_id: booking.id,
        p_reservation_id: booking.id,
        p_guest_id: null
      });

      if (error) throw error;

      toast({
        title: "Order linked",
        description: `Order linked to ${booking.guest_name}'s visit`
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to link order:', error);
      toast({
        title: "Error",
        description: "Failed to link order to visit",
        variant: "destructive"
      });
    } finally {
      setLinking(false);
    }
  };

  const handleCreateWalkIn = async (table: any) => {
    setLinking(true);
    try {
      // Step 1: Create walk-in booking (returns booking INTEGER id)
      const { data: visitId, error: walkInError } = await supabase.rpc('grace_create_walk_in', {
        p_venue_id: venueId,
        p_area_id: table.section_id,
        p_table_id: table.id,
        p_guest_id: null,
        p_source: 'Square POS',
        p_opened_at: orderTime.toISOString()
      });

      if (walkInError) throw walkInError;

      // Step 2: Link order to new walk-in (convert booking id to string)
      const { error: linkError } = await supabase.rpc('resolve_order_review', {
        p_review_id: review.id,
        p_action: 'link_to_visit',
        p_visit_id: visitId?.toString() || null,
        p_reservation_id: visitId?.toString() || null,
        p_guest_id: null
      });

      if (linkError) throw linkError;

      toast({
        title: "Walk-in created",
        description: `Walk-in created at ${table.label} and order linked`
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to create walk-in:', error);
      toast({
        title: "Error",
        description: "Failed to create walk-in and link order",
        variant: "destructive"
      });
    } finally {
      setLinking(false);
    }
  };

  // Group tables by section
  const tablesBySection = tables?.reduce((acc: any, table: any) => {
    const sectionName = table.sections?.name || 'Uncategorized';
    if (!acc[sectionName]) {
      acc[sectionName] = [];
    }
    acc[sectionName].push(table);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Order to Visit</DialogTitle>
          <DialogDescription>
            Order from {format(orderTime, 'MMM d, HH:mm')}
            {snapshot.money?.total && ` • Total: ${formatCurrency(snapshot.money.total)}`}
            {snapshot.source_name && ` • ${snapshot.source_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by guest name, table, or section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visits">
                Seated Visits ({visits?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="tables">
                Available Tables ({tables?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visits" className="flex-1 overflow-y-auto border rounded-md mt-4">
              {visitsLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading visits...
                </div>
              ) : !visits || visits.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No seated visits found within ±3 hours of order time
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((booking: any) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.guest_name}</TableCell>
                        <TableCell>
                          {booking.tables?.label || 'Unassigned'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {booking.booking_time}
                        </TableCell>
                        <TableCell>{booking.party_size}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleLinkToVisit(booking)}
                            disabled={linking}
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            Link
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="tables" className="flex-1 overflow-y-auto border rounded-md mt-4">
              {tablesLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading tables...
                </div>
              ) : !tablesBySection || Object.keys(tablesBySection).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No available tables found
                </div>
              ) : (
                <div className="divide-y">
                  {Object.entries(tablesBySection).map(([sectionName, sectionTables]: [string, any]) => (
                    <div key={sectionName} className="p-4">
                      <h3 className="font-semibold mb-3">{sectionName}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {sectionTables.map((table: any) => (
                          <div
                            key={table.id}
                            className="border rounded-lg p-3 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{table.label}</span>
                              <Badge variant="secondary" className="text-xs">
                                {table.seats} seats
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateWalkIn(table)}
                              disabled={linking}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Create Walk-in
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
