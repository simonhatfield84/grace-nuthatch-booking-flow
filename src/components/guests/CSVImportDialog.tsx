
import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, AlertCircle, CheckCircle, Users } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { useGuests, DuplicateGuest } from "@/hooks/useGuests";
import { DuplicateDetectionDialog } from "./DuplicateDetectionDialog";

interface CSVImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (guests: any[]) => void;
}

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  name: string;
  email: string;
  phone: string;
  opt_in_marketing: string;
  notes: string;
  import_visit_count: string;
  import_last_visit_date: string;
}

export const CSVImportDialog = ({ isOpen, onOpenChange, onImport }: CSVImportDialogProps) => {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: '',
    email: '',
    phone: '',
    opt_in_marketing: '',
    notes: '',
    import_visit_count: '',
    import_last_visit_date: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duplicates, setDuplicates] = useState<Array<{ newGuest: any; existingGuests: DuplicateGuest[] }>>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [processedGuests, setProcessedGuests] = useState<any[]>([]);

  const { findDuplicates, mergeGuests } = useGuests();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Try parsing with different delimiters
      const tryDelimiters = [',', ';', '\t', '|'];
      let bestResult = null;
      let bestFieldCount = 0;

      const tryParse = (delimiter: string) => {
        return new Promise<any>((resolve) => {
          Papa.parse(file, {
            header: true,
            delimiter: delimiter,
            skipEmptyLines: true,
            complete: (results) => {
              resolve(results);
            },
            error: () => {
              resolve(null);
            }
          });
        });
      };

      // Try each delimiter and pick the one that gives the most fields
      Promise.all(tryDelimiters.map(delimiter => tryParse(delimiter)))
        .then(results => {
          results.forEach((result, index) => {
            if (result && result.meta.fields && result.meta.fields.length > bestFieldCount) {
              bestFieldCount = result.meta.fields.length;
              bestResult = result;
            }
          });

          if (bestResult && bestResult.errors.length === 0) {
            setCsvData(bestResult.data as CSVRow[]);
            setCsvHeaders(bestResult.meta.fields || []);
            setErrors([]);
            
            // Auto-map common column names
            const headers = bestResult.meta.fields || [];
            const autoMapping: ColumnMapping = {
              name: '',
              email: '',
              phone: '',
              opt_in_marketing: '',
              notes: '',
              import_visit_count: '',
              import_last_visit_date: ''
            };

            headers.forEach(header => {
              const lowerHeader = header.toLowerCase().trim();
              if (lowerHeader.includes('name') && !lowerHeader.includes('email')) {
                autoMapping.name = header;
              } else if (lowerHeader.includes('email') || lowerHeader.includes('mail')) {
                autoMapping.email = header;
              } else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile') || lowerHeader.includes('tel')) {
                autoMapping.phone = header;
              } else if (lowerHeader.includes('marketing') || lowerHeader.includes('opt') || lowerHeader.includes('newsletter')) {
                autoMapping.opt_in_marketing = header;
              } else if (lowerHeader.includes('note') || lowerHeader.includes('comment') || lowerHeader.includes('remark')) {
                autoMapping.notes = header;
              } else if (lowerHeader.includes('visit') && lowerHeader.includes('count')) {
                autoMapping.import_visit_count = header;
              } else if (lowerHeader.includes('last') && lowerHeader.includes('visit')) {
                autoMapping.import_last_visit_date = header;
              }
            });

            setColumnMapping(autoMapping);
          } else {
            setErrors(['Unable to parse CSV file. Please ensure it is properly formatted with headers.']);
          }
        })
        .catch(() => {
          setErrors(['Failed to read CSV file. Please try again.']);
        });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  const validateData = () => {
    const validationErrors: string[] = [];
    const guests: any[] = [];

    if (!columnMapping.name) {
      validationErrors.push("Name column mapping is required");
      return { errors: validationErrors, guests: [] };
    }

    csvData.forEach((row, index) => {
      const guest: any = {};
      
      // Name is required
      const name = row[columnMapping.name]?.trim();
      if (!name) {
        validationErrors.push(`Row ${index + 1}: Name is required`);
        return;
      }
      guest.name = name;

      // Email
      if (columnMapping.email && columnMapping.email !== '') {
        const email = row[columnMapping.email]?.trim();
        if (email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            validationErrors.push(`Row ${index + 1}: Invalid email format`);
            return;
          }
          guest.email = email;
        }
      }

      // Phone
      if (columnMapping.phone && columnMapping.phone !== '') {
        const phone = row[columnMapping.phone]?.trim();
        if (phone) {
          guest.phone = phone;
        }
      }

      // Marketing opt-in - DEFAULT TO TRUE if no value provided
      if (columnMapping.opt_in_marketing && columnMapping.opt_in_marketing !== '') {
        const optIn = row[columnMapping.opt_in_marketing]?.trim().toLowerCase();
        guest.opt_in_marketing = optIn ? ['true', '1', 'yes', 'y', 'on'].includes(optIn) : true;
      } else {
        guest.opt_in_marketing = true; // Default to opted in
      }

      // Notes
      if (columnMapping.notes && columnMapping.notes !== '') {
        const notes = row[columnMapping.notes]?.trim();
        if (notes) {
          guest.notes = notes;
        }
      }

      // Import visit count
      if (columnMapping.import_visit_count && columnMapping.import_visit_count !== '') {
        const visitCount = row[columnMapping.import_visit_count]?.trim();
        if (visitCount && !isNaN(parseInt(visitCount))) {
          guest.import_visit_count = parseInt(visitCount);
        }
      }

      // Import last visit date
      if (columnMapping.import_last_visit_date && columnMapping.import_last_visit_date !== '') {
        const lastVisit = row[columnMapping.import_last_visit_date]?.trim();
        if (lastVisit) {
          const date = new Date(lastVisit);
          if (!isNaN(date.getTime())) {
            guest.import_last_visit_date = date.toISOString().split('T')[0];
          }
        }
      }

      // Add temporary ID for duplicate detection
      guest.tempId = `temp_${index}`;
      guests.push(guest);
    });

    return { errors: validationErrors, guests };
  };

  const checkForDuplicates = async (guests: any[]) => {
    const duplicateGroups: Array<{ newGuest: any; existingGuests: DuplicateGuest[] }> = [];
    
    for (const guest of guests) {
      if (guest.email || guest.phone) {
        try {
          const existingGuests = await findDuplicates({
            email: guest.email,
            phone: guest.phone
          });
          
          if (existingGuests.length > 0) {
            duplicateGroups.push({
              newGuest: guest,
              existingGuests
            });
          }
        } catch (error) {
          console.error('Error checking for duplicates:', error);
        }
      }
    }
    
    return duplicateGroups;
  };

  const handleImport = async () => {
    const { errors: validationErrors, guests } = validateData();
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      // Check for duplicates
      setProgress(30);
      const duplicateGroups = await checkForDuplicates(guests);
      
      if (duplicateGroups.length > 0) {
        setDuplicates(duplicateGroups);
        setProcessedGuests(guests);
        setShowDuplicateDialog(true);
        setIsProcessing(false);
        return;
      }

      // No duplicates, proceed with import
      await proceedWithImport(guests);
      
    } catch (error) {
      setErrors(['Failed to import guests. Please try again.']);
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
      setErrors(['Failed to merge guests. Please try again.']);
      setIsProcessing(false);
    }
  };

  const handleSkipDuplicates = async () => {
    setShowDuplicateDialog(false);
    await proceedWithImport(processedGuests);
  };

  const resetDialog = () => {
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMapping({ 
      name: '', 
      email: '', 
      phone: '', 
      opt_in_marketing: '', 
      notes: '',
      import_visit_count: '',
      import_last_visit_date: ''
    });
    setErrors([]);
    setIsProcessing(false);
    setProgress(0);
    setDuplicates([]);
    setProcessedGuests([]);
    onOpenChange(false);
  };

  const canImport = csvData.length > 0 && columnMapping.name && !isProcessing;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Guests from CSV</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <Label>Upload CSV File</Label>
              <div
                {...getRootProps()}
                className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'}`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                {isDragActive ? (
                  <p>Drop the CSV file here...</p>
                ) : (
                  <div>
                    <p>Drag & drop a CSV file here, or click to select</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports CSV files with comma, semicolon, tab, or pipe delimiters
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* File Info */}
            {csvHeaders.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  CSV file loaded successfully! Found {csvHeaders.length} columns and {csvData.length} rows.
                </AlertDescription>
              </Alert>
            )}

            {/* Column Mapping */}
            {csvHeaders.length > 0 && (
              <div>
                <Label>Map CSV Columns to Guest Fields</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="name-mapping">Name * (Required)</Label>
                    <Select value={columnMapping.name} onValueChange={(value) => 
                      setColumnMapping({ ...columnMapping, name: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column for Name" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map(header => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="email-mapping">Email</Label>
                    <Select value={columnMapping.email} onValueChange={(value) => 
                      setColumnMapping({ ...columnMapping, email: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column for Email" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {csvHeaders.map(header => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="phone-mapping">Phone</Label>
                    <Select value={columnMapping.phone} onValueChange={(value) => 
                      setColumnMapping({ ...columnMapping, phone: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column for Phone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {csvHeaders.map(header => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="marketing-mapping">Marketing Opt-in (defaults to Yes)</Label>
                    <Select value={columnMapping.opt_in_marketing} onValueChange={(value) => 
                      setColumnMapping({ ...columnMapping, opt_in_marketing: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column for Marketing Opt-in" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None (defaults to Yes)</SelectItem>
                        {csvHeaders.map(header => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="visit-count-mapping">Number of Visits</Label>
                    <Select value={columnMapping.import_visit_count} onValueChange={(value) => 
                      setColumnMapping({ ...columnMapping, import_visit_count: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column for Visit Count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {csvHeaders.map(header => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="last-visit-mapping">Last Visit Date</Label>
                    <Select value={columnMapping.import_last_visit_date} onValueChange={(value) => 
                      setColumnMapping({ ...columnMapping, import_last_visit_date: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column for Last Visit Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {csvHeaders.map(header => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="notes-mapping">Notes</Label>
                    <Select value={columnMapping.notes} onValueChange={(value) => 
                      setColumnMapping({ ...columnMapping, notes: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column for Notes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {csvHeaders.map(header => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            {csvData.length > 0 && columnMapping.name && (
              <div>
                <Label>Preview ({csvData.length} guests)</Label>
                <div className="mt-2 border rounded-lg p-4 bg-muted/20 max-h-40 overflow-y-auto">
                  <div className="text-sm space-y-2">
                    {csvData.slice(0, 3).map((row, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2 text-xs">
                        <div><strong>Name:</strong> {row[columnMapping.name]}</div>
                        <div><strong>Email:</strong> {columnMapping.email ? row[columnMapping.email] : '—'}</div>
                        <div><strong>Phone:</strong> {columnMapping.phone ? row[columnMapping.phone] : '—'}</div>
                      </div>
                    ))}
                    {csvData.length > 3 && (
                      <div className="text-muted-foreground">... and {csvData.length - 3} more</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Marketing Default Notice */}
            {csvData.length > 0 && (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  <strong>Marketing Opt-in Default:</strong> If no marketing column is selected or values are empty, 
                  all imported guests will be automatically opted in to marketing communications.
                </AlertDescription>
              </Alert>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <Label>Processing import...</Label>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {/* Actions */}
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
