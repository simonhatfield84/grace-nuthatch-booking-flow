
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
            {/* Basic Information */}
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

            {/* Guest Statistics - Only for existing guests */}
            {guest && (
              <div className="bg-muted/20 p-4 rounded-lg">
                <div className="text-sm font-medium mb-2">Guest Statistics</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Visits:</span>
                    <span className="ml-2 font-medium">{guest.visit_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Visit:</span>
                    <span className="ml-2 font-medium">
                      {guest.last_visit_date 
                        ? new Date(guest.last_visit_date).toLocaleDateString()
                        : "Never"
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
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
