
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Mail, Phone } from "lucide-react";
import { Guest } from "@/types/guest";
import { GuestTagsDisplay } from "./GuestTagsDisplay";

interface GuestsTableProps {
  guests: Guest[];
  selectedGuests: string[];
  onSelectGuest: (guestId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEditGuest: (guest: Guest) => void;
}

export const GuestsTable = ({
  guests,
  selectedGuests,
  onSelectGuest,
  onSelectAll,
  onEditGuest
}: GuestsTableProps) => {
  const allSelected = guests.length > 0 && selectedGuests.length === guests.length;
  const someSelected = selectedGuests.length > 0 && selectedGuests.length < guests.length;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const getGuestTier = (visitCount: number, totalSpendCents: number) => {
    if (visitCount >= 10 || totalSpendCents >= 100000) return { label: "VIP", color: "bg-yellow-100 text-yellow-800" };
    if (visitCount >= 5 || totalSpendCents >= 50000) return { label: "Regular", color: "bg-blue-100 text-blue-800" };
    if (visitCount > 1) return { label: "Returning", color: "bg-green-100 text-green-800" };
    return { label: "New", color: "bg-gray-100 text-gray-800" };
  };

  const handleSelectAllChange = (value: boolean | 'indeterminate') => {
    if (value === 'indeterminate') {
      onSelectAll(false);
    } else {
      onSelectAll(value);
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={handleSelectAllChange}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="w-20">Visits</TableHead>
            <TableHead className="w-28">Total Spend</TableHead>
            <TableHead className="w-24">Avg/Visit</TableHead>
            <TableHead>Last Visit</TableHead>
            <TableHead className="w-24">Tags</TableHead>
            <TableHead className="w-24">Marketing</TableHead>
            <TableHead className="w-32">Notes</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
        {guests.map((guest) => {
            const tier = getGuestTier(guest.actual_visit_count || 0, guest.total_spend_cents || 0);
            const isSelected = selectedGuests.includes(guest.id);
            
            return (
              <TableRow key={guest.id} className={isSelected ? "bg-muted/50" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelectGuest(guest.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{guest.name}</div>
                    <Badge className={tier.color} variant="secondary">
                      {tier.label}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {guest.email && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{guest.email}</span>
                      </div>
                    )}
                    {guest.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{guest.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-bold">{guest.actual_visit_count || 0}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">
                    £{((guest.total_spend_cents || 0) / 100).toFixed(2)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    £{((guest.average_spend_per_visit_cents || 0) / 100).toFixed(2)}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {formatDate(guest.last_actual_visit_date)}
                  </span>
                </TableCell>
                <TableCell>
                  <GuestTagsDisplay tags={guest.tags || []} />
                </TableCell>
                <TableCell>
                  <Badge variant={guest.opt_in_marketing ? "default" : "secondary"} className="text-xs">
                    {guest.opt_in_marketing ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-[120px] truncate text-xs text-muted-foreground">
                    {guest.notes || "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditGuest(guest)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {guests.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No guests found matching your criteria.
        </div>
      )}
    </div>
  );
};
