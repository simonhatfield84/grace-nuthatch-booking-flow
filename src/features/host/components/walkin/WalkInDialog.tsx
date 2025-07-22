
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GuestSearch } from "./GuestSearch";
import { ConflictResolution } from "./ConflictResolution";
import { ValidationPanel } from "./ValidationPanel";
import { useWalkInFlow } from "../../hooks/useWalkInFlow";

interface WalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  selectedTime?: string;
  preselectedTableId?: number;
}

export function WalkInDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
  preselectedTableId
}: WalkInDialogProps) {
  const {
    currentStep,
    walkInData,
    conflicts,
    isLoading,
    error,
    handleGuestSelection,
    handleConflictResolution,
    handleValidationComplete,
    nextStep,
    prevStep,
    resetFlow
  } = useWalkInFlow({
    selectedDate,
    selectedTime,
    preselectedTableId
  });

  const handleClose = () => {
    resetFlow();
    onOpenChange(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'guest-search':
        return (
          <GuestSearch
            onGuestSelect={handleGuestSelection}
            onCreateNew={(guestData) => {
              handleGuestSelection(null, guestData);
            }}
            isLoading={isLoading}
          />
        );
      
      case 'conflict-resolution':
        return (
          <ConflictResolution
            conflicts={conflicts}
            walkInData={walkInData}
            onResolve={handleConflictResolution}
            onBack={prevStep}
            isLoading={isLoading}
          />
        );
      
      case 'validation':
        return (
          <ValidationPanel
            walkInData={walkInData}
            onConfirm={handleValidationComplete}
            onBack={prevStep}
            isLoading={isLoading}
            error={error}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'guest-search' && 'Walk-in Guest'}
            {currentStep === 'conflict-resolution' && 'Resolve Conflicts'}
            {currentStep === 'validation' && 'Confirm Walk-in'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {renderStep()}
        </div>

        <div className="flex justify-between mt-6">
          {currentStep !== 'guest-search' && (
            <Button variant="outline" onClick={prevStep}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
