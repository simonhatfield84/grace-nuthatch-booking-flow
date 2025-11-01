
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Trash2 } from "lucide-react";
import { Guest } from "@/types/guest";
import { useTags } from "@/hooks/useTags";
import { useGuestTags } from "@/hooks/useGuestTags";
import { useGuests } from "@/hooks/useGuests";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { GuestBookingHistory } from "./GuestBookingHistory";
import { GuestNotes } from "./GuestNotes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GuestDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  guest: Guest | null;
  onSave: (guestData: Partial<Guest>) => void;
}

export const GuestDialog = ({ isOpen, onOpenChange, guest, onSave }: GuestDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    opt_in_marketing: false,
    notes: ""
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { tags } = useTags();
  const { assignTag, removeTag } = useGuestTags();
  const { deleteGuest } = useGuests();

  // Fetch venue_id for guest notes
  const { data: venueData } = useQuery({
    queryKey: ['user-venue'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();
      
      return data;
    }
  });

  useEffect(() => {
    if (guest) {
      setFormData({
        name: guest.name,
        email: guest.email || "",
        phone: guest.phone || "",
        opt_in_marketing: guest.opt_in_marketing,
        notes: guest.notes || ""
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        opt_in_marketing: false,
        notes: ""
      });
    }
  }, [guest]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!guest) return;
    
    setIsDeleting(true);
    try {
      await deleteGuest(guest.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete guest:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignTag = async (tagId: string) => {
    if (!guest) return;
    try {
      await assignTag({ guestId: guest.id, tagId });
    } catch (error) {
      console.error('Failed to assign tag:', error);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!guest) return;
    try {
      await removeTag({ guestId: guest.id, tagId });
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  const manualTags = tags.filter(tag => !tag.is_automatic);
  const guestTagIds = guest?.tags?.map(tag => tag.id) || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {guest ? 'Edit Guest' : 'Add New Guest'}
              {guest && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Guest Metrics Card - Top of dialog for existing guests */}
            {guest && (guest.actual_visit_count || guest.total_spend_cents) && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
                <div className="text-base font-semibold mb-3">Guest Metrics</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Visits</div>
                    <div className="text-2xl font-bold">{guest.actual_visit_count || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Spend</div>
                    <div className="text-2xl font-bold">
                      £{((guest.total_spend_cents || 0) / 100).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Avg per Visit</div>
                    <div className="text-2xl font-bold">
                      £{((guest.average_spend_per_visit_cents || 0) / 100).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Avg per Cover</div>
                    <div className="text-2xl font-bold">
                      £{((guest.average_spend_per_cover_cents || 0) / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
                {guest.last_actual_visit_date && (
                  <div className="mt-3 pt-3 border-t border-primary/20">
                    <div className="text-sm text-muted-foreground">Last Visit</div>
                    <div className="text-base font-semibold">
                      {new Date(guest.last_actual_visit_date).toLocaleDateString('en-GB', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}
                {/* Missing Data Warnings */}
                {(!guest.email || !guest.phone || guest.opt_in_marketing === null) && (
                  <div className="mt-3 pt-3 border-t border-orange-500/20 space-y-1">
                    {!guest.email && (
                      <div className="text-xs text-orange-600 flex items-center gap-1">
                        ⚠️ No email address (can't send confirmations)
                      </div>
                    )}
                    {!guest.phone && (
                      <div className="text-xs text-orange-600 flex items-center gap-1">
                        ⚠️ No phone number (can't send SMS)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Basic Information Form */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Guest name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="guest@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+44 7700 900123"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="marketing"
                  checked={formData.opt_in_marketing}
                  onCheckedChange={(checked) => setFormData({ ...formData, opt_in_marketing: checked })}
                />
                <Label htmlFor="marketing">Opt-in to marketing</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special notes about this guest..."
                rows={3}
              />
            </div>

            {/* Booking History - Only for existing guests */}
            {guest && (
              <div className="border-t pt-4">
                <GuestBookingHistory
                  guestId={guest.id}
                  guestEmail={guest.email || undefined}
                  guestPhone={guest.phone || undefined}
                />
              </div>
            )}

            {/* Notes Timeline - Only for existing guests */}
            {guest && venueData?.venue_id && (
              <div className="border-t pt-4">
                <GuestNotes guestId={guest.id} venueId={venueData.venue_id} />
              </div>
            )}

            {/* Tags Section - Only for existing guests */}
            {guest && (
              <div>
                <Label>Tags</Label>
                
                {/* Current Tags */}
                <div className="mt-2 mb-4">
                  <div className="text-sm text-muted-foreground mb-2">Current Tags:</div>
                  <div className="flex flex-wrap gap-2">
                    {guest.tags?.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        style={{ backgroundColor: tag.color + '20', borderColor: tag.color, color: tag.color }}
                        className="flex items-center gap-1"
                      >
                        {tag.name}
                        {tag.is_automatic && (
                          <span className="text-xs opacity-70">(auto)</span>
                        )}
                        {!tag.is_automatic && (
                          <button
                            onClick={() => handleRemoveTag(tag.id)}
                            className="ml-1 hover:bg-red-100 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                    {guest.tags?.length === 0 && (
                      <span className="text-sm text-muted-foreground">No tags assigned</span>
                    )}
                  </div>
                </div>

                {/* Available Manual Tags */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Add Manual Tags:</div>
                  <div className="flex flex-wrap gap-2">
                    {manualTags
                      .filter(tag => !guestTagIds.includes(tag.id))
                      .map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="cursor-pointer hover:opacity-80"
                          style={{ borderColor: tag.color, color: tag.color }}
                          onClick={() => handleAssignTag(tag.id)}
                        >
                          + {tag.name}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Bottom with Save at top too */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!formData.name.trim()}>
                {guest ? 'Update Guest' : 'Create Guest'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Guest"
        description={`Are you sure you want to delete ${guest?.name}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </>
  );
};
