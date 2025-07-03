
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, Phone, Mail, MessageSquare } from "lucide-react";

interface ReservationPopupProps {
  reservation: any;
  table: any;
  updateReservationStatus: (id: number, status: string) => void;
}

export const ReservationPopup = ({ reservation, table, updateReservationStatus }: ReservationPopupProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'seated': return 'bg-green-100 text-green-800 border-green-200';
      case 'finished': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-grace-light mb-2">Reservation Details</h3>
        <p className="text-sm text-grace-light/70">
          Table {table?.label} • {reservation.startTime} ({reservation.duration * 15} mins)
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarFallback className="bg-grace-accent text-grace-light">
            {reservation.guest.split(' ').map((n: string) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium text-grace-light">{reservation.guest}</h3>
          <div className="flex items-center gap-4 text-sm text-grace-light/70">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" strokeWidth={2} />
              {reservation.party} guests
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" strokeWidth={2} />
              {reservation.service}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center gap-2 text-sm text-grace-light/70">
          <Phone className="h-4 w-4" strokeWidth={2} />
          <span>{reservation.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-grace-light/70">
          <Mail className="h-4 w-4" strokeWidth={2} />
          <span>{reservation.email}</span>
        </div>
      </div>

      <div>
        <Badge className={getStatusColor(reservation.status)}>
          {reservation.status}
        </Badge>
      </div>

      {reservation.notes && (
        <div className="p-3 bg-grace-accent/10 rounded">
          <p className="text-sm text-grace-light">{reservation.notes}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button 
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => updateReservationStatus(reservation.id, 'seated')}
        >
          Seat Guests
        </Button>
        <Button 
          size="sm"
          className="bg-grace-accent hover:bg-grace-accent/90 text-grace-light"
          onClick={() => updateReservationStatus(reservation.id, 'finished')}
        >
          Mark Finished
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          className="border-grace-secondary text-grace-secondary hover:bg-grace-secondary hover:text-grace-light"
        >
          <MessageSquare className="h-4 w-4 mr-2" strokeWidth={2} />
          Message
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
          onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
