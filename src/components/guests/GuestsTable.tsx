
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Mail, Phone } from "lucide-react";
import { Guest } from "@/hooks/useGuests";

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

  const getGuestTier = (visitCount: number) => {
    if (visitCount >= 10) return { label: "VIP", color: "bg-yellow-100 text-yellow-800" };
    if (visitCount >= 5) return { label: "Regular", color: "bg-blue-100 text-blue-800" };
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
            <TableHead>Visits</TableHead>
            <TableHead>Last Visit</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Marketing</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.map((guest) => {
            const tier = getGuestTier(guest.visit_count || 0);
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
                <TableCell>
                  <div className="text-center">
                    <div className="font-bold">{guest.visit_count || 0}</div>
                    <div className="text-xs text-muted-foreground">visits</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {formatDate(guest.last_visit_date)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {guest.tags?.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs"
                        style={{ 
                          backgroundColor: tag.color + '20',
                          borderColor: tag.color,
                          color: tag.color 
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    {(guest.tags?.length || 0) > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(guest.tags?.length || 0) - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={guest.opt_in_marketing ? "default" : "secondary"}>
                    {guest.opt_in_marketing ? "Opted In" : "Opted Out"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-[150px] truncate text-xs text-muted-foreground">
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
