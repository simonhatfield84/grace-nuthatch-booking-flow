import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface WalkInDialogProps {
  tables: any[];
  timeSlots: string[];
  reservations: any[];
  setReservations: (reservations: any[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  preSelectedTable?: number;
  preSelectedTime?: string;
}

export const WalkInDialog = ({ 
  tables, 
  timeSlots, 
  reservations, 
  setReservations, 
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  preSelectedTable,
  preSelectedTime
}: WalkInDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState({
    guest: "",
    party: "",
    tableId: preSelectedTable?.toString() || "",
    startTime: preSelectedTime || "",
    duration: "4",
    phone: "",
    email: "",
    notes: ""
  });

  // Use controlled or internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Update form when pre-selected values change
  useEffect(() => {
    if (preSelectedTable) {
      setFormData(prev => ({ ...prev, tableId: preSelectedTable.toString() }));
    }
    if (preSelectedTime) {
      setFormData(prev => ({ ...prev, startTime: preSelectedTime }));
    }
  }, [preSelectedTable, preSelectedTime]);

  const getAvailableTables = () => {
    const currentTime = formData.startTime;
    if (!currentTime) return tables;
    
    return tables.filter(table => {
      const hasConflict = reservations.some(res => {
        if (res.tableId !== table.id) return false;
        const resStartIndex = timeSlots.indexOf(res.startTime);
        const resEndIndex = resStartIndex + res.duration;
        const newStartIndex = timeSlots.indexOf(currentTime);
        const newEndIndex = newStartIndex + parseInt(formData.duration);
        
        return !(newEndIndex <= resStartIndex || newStartIndex >= resEndIndex);
      });
      return !hasConflict;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newReservation = {
      id: Math.max(...reservations.map(r => r.id), 0) + 1,
      tableId: parseInt(formData.tableId),
      startTime: formData.startTime,
      duration: parseInt(formData.duration),
      guest: formData.guest.trim() || "Walk-in",
      party: parseInt(formData.party),
      service: "Walk-in",
      status: "seated",
      phone: formData.phone,
      email: formData.email,
      notes: formData.notes
    };

    setReservations([...reservations, newReservation]);
    setFormData({
      guest: "",
      party: "",
      tableId: "",
      startTime: "",
      duration: "4",
      phone: "",
      email: "",
      notes: ""
    });
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-grace-accent text-grace-light border-grace-accent hover:bg-grace-accent/90">
          <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
          Walk-in
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-grace-dark text-grace-light border-grace-accent/30 max-w-md">
        <DialogHeader>
          <DialogTitle>Add Walk-in</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="guest">Guest Name (optional)</Label>
              <Input
                id="guest"
                value={formData.guest}
                onChange={(e) => setFormData({ ...formData, guest: e.target.value })}
                className="bg-grace-dark border-grace-accent/30 text-grace-light"
                placeholder="Leave empty for 'Walk-in'"
              />
            </div>
            <div>
              <Label htmlFor="party">Party Size</Label>
              <Input
                id="party"
                type="number"
                min="1"
                value={formData.party}
                onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                className="bg-grace-dark border-grace-accent/30 text-grace-light"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Select value={formData.startTime} onValueChange={(value) => setFormData({ ...formData, startTime: value })}>
                <SelectTrigger className="bg-grace-dark border-grace-accent/30 text-grace-light">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="bg-grace-dark border-grace-accent/30">
                  {timeSlots.map(time => (
                    <SelectItem key={time} value={time} className="text-grace-light">{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                <SelectTrigger className="bg-grace-dark border-grace-accent/30 text-grace-light">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-grace-dark border-grace-accent/30">
                  <SelectItem value="2" className="text-grace-light">30 min</SelectItem>
                  <SelectItem value="4" className="text-grace-light">1 hour</SelectItem>
                  <SelectItem value="6" className="text-grace-light">1.5 hours</SelectItem>
                  <SelectItem value="8" className="text-grace-light">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="table">Table</Label>
            <Select value={formData.tableId} onValueChange={(value) => setFormData({ ...formData, tableId: value })}>
              <SelectTrigger className="bg-grace-dark border-grace-accent/30 text-grace-light">
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent className="bg-grace-dark border-grace-accent/30">
                {getAvailableTables().map(table => (
                  <SelectItem key={table.id} value={table.id.toString()} className="text-grace-light">
                    {table.label} ({table.seats} seats)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-grace-dark border-grace-accent/30 text-grace-light"
              />
            </div>
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-grace-dark border-grace-accent/30 text-grace-light"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-grace-dark border-grace-accent/30 text-grace-light"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-grace-accent hover:bg-grace-accent/90">
              Add Walk-in
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
