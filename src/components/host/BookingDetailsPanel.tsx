
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, Users, MapPin, Phone, Mail, MessageSquare, Edit2 } from "lucide-react";
import { format } from "date-fns";

interface BookingDetailsPanelProps {
  booking: any;
  table?: any;
  onEdit?: () => void;
}

export const BookingDetailsPanel = ({ booking, table, onEdit }: BookingDetailsPanelProps) => {
  if (!booking) {
    return (
      <Card className="h-full bg-[#111315] border-[#292C2D]">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-[#676767] font-inter">Select a booking to view details</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-[#C2D8E9] text-[#111315] border-[#C2D8E9]/30';
      case 'seated': return 'bg-[#CCF0DB] text-[#111315] border-[#CCF0DB]/30';
      case 'finished': return 'bg-[#676767] text-white border-[#676767]/30';
      case 'cancelled': return 'bg-[#E47272] text-white border-[#E47272]/30';
      case 'late': return 'bg-[#F1C8D0] text-[#111315] border-[#F1C8D0]/30';
      case 'no-show': return 'bg-[#E47272] text-white border-[#E47272]/30';
      default: return 'bg-[#C2D8E9] text-[#111315] border-[#C2D8E9]/30';
    }
  };

  return (
    <Card className="h-full bg-[#111315] border-[#292C2D]">
      <CardHeader className="bg-[#292C2D] border-b border-[#676767]/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white font-inter">Booking Details</CardTitle>
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="border-[#676767] text-white hover:bg-[#676767]/20"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      
      <ScrollArea className="h-[calc(100%-80px)]">
        <CardContent className="p-4 space-y-4">
          {/* Booking Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white font-inter">{booking.guest_name}</h3>
              <Badge className={`${getStatusColor(booking.status)} font-inter font-medium px-2 py-1`}>
                {booking.status}
              </Badge>
            </div>
            {booking.booking_reference && (
              <p className="text-xs text-[#676767] font-inter">Ref: {booking.booking_reference}</p>
            )}
          </div>

          <Separator className="bg-[#676767]/20" />

          {/* Booking Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-white">
              <Calendar className="h-4 w-4 text-[#C2D8E9]" />
              <span className="font-inter">{format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-white">
              <Clock className="h-4 w-4 text-[#C2D8E9]" />
              <span className="font-inter">{booking.booking_time}</span>
              {booking.duration_minutes && (
                <span className="text-[#676767] font-inter">({booking.duration_minutes} mins)</span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-white">
              <Users className="h-4 w-4 text-[#CCF0DB]" />
              <span className="font-inter">{booking.party_size} guests</span>
            </div>

            {table && (
              <div className="flex items-center gap-2 text-sm text-white">
                <MapPin className="h-4 w-4 text-[#F1C8D0]" />
                <span className="font-inter">Table {table.label}</span>
                {table.capacity && (
                  <span className="text-[#676767] font-inter">(capacity: {table.capacity})</span>
                )}
              </div>
            )}

            {booking.service && booking.service !== 'Walk-in' && (
              <div className="text-sm">
                <span className="text-[#676767] font-inter">Service:</span>
                <span className="text-white font-inter ml-2">{booking.service}</span>
              </div>
            )}
          </div>

          <Separator className="bg-[#676767]/20" />

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-white font-inter">Contact Details</h4>
            
            {booking.email && (
              <div className="flex items-center gap-2 text-sm text-white">
                <Mail className="h-4 w-4 text-[#C2D8E9]" />
                <span className="font-inter">{booking.email}</span>
              </div>
            )}
            
            {booking.phone && (
              <div className="flex items-center gap-2 text-sm text-white">
                <Phone className="h-4 w-4 text-[#CCF0DB]" />
                <span className="font-inter">{booking.phone}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {booking.notes && (
            <>
              <Separator className="bg-[#676767]/20" />
              <div className="space-y-2">
                <h4 className="font-medium text-white font-inter flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes
                </h4>
                <p className="text-sm text-[#676767] font-inter bg-[#292C2D] p-3 rounded border border-[#676767]/20">
                  {booking.notes}
                </p>
              </div>
            </>
          )}

          {/* Timestamps */}
          <Separator className="bg-[#676767]/20" />
          <div className="space-y-2">
            <h4 className="font-medium text-white font-inter">Booking History</h4>
            <div className="text-xs text-[#676767] font-inter space-y-1">
              <p>Created: {format(new Date(booking.created_at), 'MMM d, yyyy \'at\' h:mm a')}</p>
              {booking.updated_at && booking.updated_at !== booking.created_at && (
                <p>Updated: {format(new Date(booking.updated_at), 'MMM d, yyyy \'at\' h:mm a')}</p>
              )}
            </div>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
};
