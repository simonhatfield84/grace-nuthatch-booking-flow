import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Clock, Users, MapPin, DollarSign, AlertTriangle, Banknote } from "lucide-react";

interface BookingListViewProps {
  bookings: any[];
  tables: any[];
  onBookingClick: (booking: any) => void;
}

interface BookingWithPayment {
  id: number;
  guest_name: string;
  booking_time: string;
  party_size: number;
  status: string;
  table_id?: number;
  is_unallocated?: boolean;
  service?: string;
  notes?: string;
  payment_status?: string;
  payment_amount?: number;
  requires_payment?: boolean;
}

export const BookingListView = ({ bookings, tables, onBookingClick }: BookingListViewProps) => {
  // Fetch payment data for bookings
  const { data: paymentData = [] } = useQuery({
    queryKey: ['booking-payments', bookings.map(b => b.id)],
    queryFn: async () => {
      if (bookings.length === 0) return [];
      
      const { data, error } = await supabase
        .from('booking_payments')
        .select('booking_id, status, amount_cents')
        .in('booking_id', bookings.map(b => b.id));
      
      if (error) throw error;
      return data || [];
    },
    enabled: bookings.length > 0
  });

  // Enhance bookings with payment data
  const bookingsWithPayments: BookingWithPayment[] = bookings.map(booking => {
    const payment = paymentData.find(p => p.booking_id === booking.id);
    return {
      ...booking,
      payment_status: payment?.status,
      payment_amount: payment?.amount_cents,
      requires_payment: !!payment
    };
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-[#C2D8E9] text-[#111315] border-[#C2D8E9]/30';
      case 'seated': return 'bg-[#CCF0DB] text-[#111315] border-[#CCF0DB]/30';
      case 'finished': return 'bg-[#676767] text-white border-[#676767]/30';
      case 'cancelled': return 'bg-[#E47272] text-white border-[#E47272]/30';
      case 'late': return 'bg-[#F1C8D0] text-[#111315] border-[#F1C8D0]/30';
      case 'no-show': return 'bg-[#E47272] text-white border-[#E47272]/30';
      case 'pending_payment': return 'bg-[#FFA500] text-white border-[#FFA500]/30';
      default: return 'bg-[#C2D8E9] text-[#111315] border-[#C2D8E9]/30';
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'succeeded': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getBookingCardStyle = (status: string) => {
    const isInactive = status === 'no-show' || status === 'cancelled';
    return isInactive 
      ? 'bg-[#292C2D] border-[#E47272] opacity-75' 
      : 'bg-[#292C2D] border-[#676767]/20 hover:bg-[#676767]/20';
  };

  // Sort bookings by priority: unallocated first, then by status, then by time
  const sortedBookings = [...bookingsWithPayments].sort((a, b) => {
    // Unallocated bookings first
    if (a.is_unallocated && !b.is_unallocated) return -1;
    if (!a.is_unallocated && b.is_unallocated) return 1;
    
    // Then sort by status priority
    const statusPriority: Record<string, number> = {
      'pending_payment': 1,
      'confirmed': 2,
      'seated': 3,
      'finished': 4,
      'cancelled': 5,
      'no_show': 6
    };

    // Failed payments get highest priority after unallocated
    if (a.payment_status === 'failed' && b.payment_status !== 'failed') return -1;
    if (a.payment_status !== 'failed' && b.payment_status === 'failed') return 1;
    
    const aPriority = statusPriority[a.status] || 10;
    const bPriority = statusPriority[b.status] || 10;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Finally sort by time
    return a.booking_time.localeCompare(b.booking_time);
  });

  // Group bookings by category with enhanced payment categorization
  const unallocatedBookings = sortedBookings.filter(b => b.is_unallocated || !b.table_id);
  const failedPaymentBookings = sortedBookings.filter(b => b.payment_status === 'failed');
  const activeBookings = sortedBookings.filter(b => 
    !b.is_unallocated && 
    b.table_id && 
    !['cancelled', 'no_show', 'finished'].includes(b.status) &&
    b.payment_status !== 'failed'
  );
  const cancelledBookings = sortedBookings.filter(b => 
    ['cancelled', 'no_show'].includes(b.status) && b.payment_status !== 'failed'
  );
  const finishedBookings = sortedBookings.filter(b => 
    b.status === 'finished' && b.payment_status !== 'failed'
  );

  const renderBookingGroup = (bookings: any[], title: string, highlightClass?: string) => {
    if (bookings.length === 0) return null;

    return (
      <div className="mb-4">
        <div className={`text-xs font-semibold text-[#676767] mb-2 px-2 py-1 rounded ${highlightClass || ''}`}>
          {title} ({bookings.length})
        </div>
        <div className="space-y-2">
          {bookings.map((booking) => {
            const table = tables.find(t => t.id === booking.table_id);
            
            return (
              <div
                key={booking.id}
                className={`p-2 rounded border cursor-pointer transition-all duration-200 ${getBookingCardStyle(booking.status)}`}
                onClick={() => onBookingClick(booking)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm font-inter truncate">
                        {booking.guest_name}
                      </span>
                      <Badge className={`${getStatusColor(booking.status)} font-inter font-medium px-1.5 py-0.5 text-xs`}>
                        {booking.status}
                      </Badge>
                      
                      {/* Payment Status Indicators */}
                      {booking.payment_status === 'succeeded' && (
                        <div title="Payment Received">
                          <Banknote className="h-3 w-3 text-green-600" />
                        </div>
                      )}
                      {booking.payment_status === 'failed' && (
                        <div title="Payment Failed">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                        </div>
                      )}
                      {booking.payment_status === 'pending' && (
                        <div title="Payment Pending">
                          <Clock className="h-3 w-3 text-orange-600" />
                        </div>
                      )}
                      {booking.requires_payment && !booking.payment_status && (
                        <div title="Payment Required">
                          <DollarSign className="h-3 w-3 text-[#CCF0DB] opacity-80" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-[#676767]">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#C2D8E9]" />
                        <span className="font-inter">{booking.booking_time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-[#CCF0DB]" />
                        <span className="font-inter">{booking.party_size}</span>
                      </div>
                      {table && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-[#F1C8D0]" />
                          <span className="font-inter">{table.label}</span>
                        </div>
                      )}
                      {booking.service && booking.service !== 'Walk-in' && (
                        <span className="text-[#676767] font-inter text-xs truncate">
                          {booking.service}
                        </span>
                      )}
                    </div>

                    {/* Payment Amount Display */}
                    {booking.payment_amount && (
                      <div className="mt-1 text-xs font-inter">
                        <span className={`${getPaymentStatusColor(booking.payment_status)}`}>
                          £{(booking.payment_amount / 100).toFixed(2)} 
                          {booking.payment_status && ` (${booking.payment_status})`}
                        </span>
                      </div>
                    )}

                    {booking.notes && (
                      <div className="mt-1 text-xs text-[#676767] font-inter italic truncate">
                        {booking.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-[#111315] rounded-lg overflow-hidden border border-[#292C2D]">
      <div className="bg-[#292C2D] border-b border-[#676767]/20 p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white font-inter">Bookings</h2>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#CCF0DB]" />
            <span className="text-white font-inter text-sm">{bookings.length}</span>
          </div>
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="p-3">
          {renderBookingGroup(unallocatedBookings, "Needs Table Assignment", "bg-orange-500/20 text-orange-400")}
          {renderBookingGroup(failedPaymentBookings, "Failed Payments", "bg-red-500/20 text-red-400")}
          {renderBookingGroup(activeBookings, "Active Reservations")}
          {renderBookingGroup(cancelledBookings, "Cancelled & No-Shows")}
          {renderBookingGroup(finishedBookings, "Finished")}
          
          {bookings.length === 0 && (
            <div className="text-center text-[#676767] py-8">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-inter">No bookings for this date</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};