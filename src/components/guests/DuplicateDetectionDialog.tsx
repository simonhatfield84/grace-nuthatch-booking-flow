import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Mail, Phone, Calendar, AlertTriangle } from "lucide-react";
import { DuplicateGuest } from "@/types/guest";

interface DuplicateDetectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: Array<{
    newGuest: any;
    existingGuests: DuplicateGuest[];
  }>;
  onMergeSelected: (mergeActions: Array<{ primaryId: string; duplicateId: string }>) => void;
  onSkipDuplicates: () => void;
}

export const DuplicateDetectionDialog = ({
  isOpen,
  onOpenChange,
  duplicates,
  onMergeSelected,
  onSkipDuplicates
}: DuplicateDetectionDialogProps) => {
  const [selectedMerges, setSelectedMerges] = useState<Record<string, string>>({});

  const handleMergeSelection = (newGuestKey: string, existingGuestId: string) => {
    setSelectedMerges(prev => ({
      ...prev,
      [newGuestKey]: existingGuestId
    }));
  };

  const handleConfirmMerges = () => {
    const mergeActions = Object.entries(selectedMerges).map(([key, primaryId]) => {
      const duplicate = duplicates.find((_, index) => index.toString() === key);
      return {
        primaryId,
        duplicateId: duplicate?.newGuest.tempId || ''
      };
    });
    
    onMergeSelected(mergeActions);
  };

  const totalDuplicates = duplicates.length;
  const selectedMergeCount = Object.keys(selectedMerges).length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Duplicate Guests Detected
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              Found {totalDuplicates} potential duplicate{totalDuplicates > 1 ? 's' : ''} in your import. 
              Review and choose which guests to merge to avoid duplicates in your database.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {duplicates.map((duplicate, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <Users className="h-4 w-4" />
                  New Guest: {duplicate.newGuest.name}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* New Guest Info */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                      New Guest (from import)
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {duplicate.newGuest.name}
                      </div>
                      {duplicate.newGuest.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {duplicate.newGuest.email}
                        </div>
                      )}
                      {duplicate.newGuest.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {duplicate.newGuest.phone}
                        </div>
                      )}
                      {duplicate.newGuest.import_visit_count && (
                        <div>Visits: {duplicate.newGuest.import_visit_count}</div>
                      )}
                    </div>
                  </div>

                  {/* Existing Guests */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                      Existing Guests (in database)
                    </div>
                    {duplicate.existingGuests.map((existing) => (
                      <div key={existing.id} className="border rounded p-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              {existing.name}
                            </div>
                            {existing.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {existing.email}
                              </div>
                            )}
                            {existing.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {existing.phone}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              Added: {new Date(existing.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline">
                              Match: {existing.match_type}
                            </Badge>
                            <Checkbox
                              checked={selectedMerges[index.toString()] === existing.id}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleMergeSelection(index.toString(), existing.id);
                                } else {
                                  setSelectedMerges(prev => {
                                    const newState = { ...prev };
                                    delete newState[index.toString()];
                                    return newState;
                                  });
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedMergeCount} of {totalDuplicates} duplicates selected for merging
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onSkipDuplicates}>
                Skip All & Import Anyway
              </Button>
              <Button 
                onClick={handleConfirmMerges}
                disabled={selectedMergeCount === 0}
              >
                Merge Selected ({selectedMergeCount})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
