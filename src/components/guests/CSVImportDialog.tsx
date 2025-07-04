
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Users } from "lucide-react";
import { DuplicateGuest } from "@/types/guest";
import { useCSVParser } from "@/hooks/useCSVParser";
import { useCSVValidation } from "@/hooks/useCSVValidation";
import { useCSVDuplicateCheck } from "@/hooks/useCSVDuplicateCheck";
import { useGuestDuplicates } from "@/hooks/useGuestDuplicates";
import { CSVFileUpload } from "./csv/CSVFileUpload";
import { CSVColumnMapping } from "./csv/CSVColumnMapping";
import { CSVPreview } from "./csv/CSVPreview";
import { CSVProgress } from "./csv/CSVProgress";
import { DuplicateDetectionDialog } from "./DuplicateDetectionDialog";

interface CSVImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (guests: any[]) => void;
}

export const CSVImportDialog = ({ isOpen, onOpenChange, onImport }: CSVImportDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedGuests, setProcessedGuests] = useState<any[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const { csvData, csvHeaders, columnMapping, setColumnMapping, errors, parseFile, resetParser } = useCSVParser();
  const { errors: validationErrors, guests: validatedGuests } = useCSVValidation(csvData, columnMapping);
  const { duplicates, checkForDuplicates, resetDuplicates } = useCSVDuplicateCheck();
  const { mergeGuests } = useGuestDuplicates();

  const allErrors = [...errors, ...validationErrors];

  const handleImport = async () => {
    if (allErrors.length > 0) {
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      // Check for duplicates
      setProgress(30);
      const duplicateGroups = await checkForDuplicates(validatedGuests);
      
      if (duplicateGroups.length > 0) {
        setProcessedGuests(validatedGuests);
        setShowDuplicateDialog(true);
        setIsProcessing(false);
        return;
      }

      // No duplicates, proceed with import
      await proceedWithImport(validatedGuests);
      
    } catch (error) {
      console.error('Import error:', error);
      setIsProcessing(false);
    }
  };

  const proceedWithImport = async (guests: any[]) => {
    setProgress(70);
    
    // Remove temp IDs before import
    const cleanGuests = guests.map(guest => {
      const { tempId, ...cleanGuest } = guest;
      return cleanGuest;
    });

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      setProgress(Math.min(70 + (i * 0.3), 100));
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await onImport(cleanGuests);
    resetDialog();
  };

  const handleMergeSelected = async (mergeActions: Array<{ primaryId: string; duplicateId: string }>) => {
    setShowDuplicateDialog(false);
    setIsProcessing(true);
    setProgress(50);

    try {
      // Perform merges
      for (const action of mergeActions) {
        await mergeGuests({
          primaryId: action.primaryId,
          duplicateId: action.duplicateId
        });
      }

      // Filter out guests that were merged
      const mergedTempIds = mergeActions.map(action => action.duplicateId);
      const remainingGuests = processedGuests.filter(guest => !mergedTempIds.includes(guest.tempId));
      
      await proceedWithImport(remainingGuests);
      
    } catch (error) {
      console.error('Merge error:', error);
      setIsProcessing(false);
    }
  };

  const handleSkipDuplicates = async () => {
    setShowDuplicateDialog(false);
    await proceedWithImport(processedGuests);
  };

  const resetDialog = () => {
    resetParser();
    resetDuplicates();
    setIsProcessing(false);
    setProgress(0);
    setProcessedGuests([]);
    onOpenChange(false);
  };

  const canImport = csvData.length > 0 && columnMapping.name !== 'none' && !isProcessing && allErrors.length === 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Guests from CSV</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <CSVFileUpload onFileUpload={parseFile} />

            {csvHeaders.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  CSV file loaded successfully! Found {csvHeaders.length} columns and {csvData.length} rows.
                </AlertDescription>
              </Alert>
            )}

            {csvHeaders.length > 0 && (
              <CSVColumnMapping
                headers={csvHeaders}
                columnMapping={columnMapping}
                onMappingChange={setColumnMapping}
              />
            )}

            <CSVPreview data={csvData} columnMapping={columnMapping} />

            {csvData.length > 0 && (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  <strong>Marketing Opt-in Default:</strong> If no marketing column is selected or values are empty, 
                  all imported guests will be automatically opted in to marketing communications.
                </AlertDescription>
              </Alert>
            )}

            {allErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {allErrors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <CSVProgress isProcessing={isProcessing} progress={progress} />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!canImport}>
                {isProcessing ? 'Processing...' : `Import ${csvData.length} Guests`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DuplicateDetectionDialog
        isOpen={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        duplicates={duplicates}
        onMergeSelected={handleMergeSelected}
        onSkipDuplicates={handleSkipDuplicates}
      />
    </>
  );
};
