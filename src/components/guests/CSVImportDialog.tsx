
import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";

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
}

export const CSVImportDialog = ({ isOpen, onOpenChange, onImport }: CSVImportDialogProps) => {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: '',
    email: '',
    phone: '',
    opt_in_marketing: '',
    notes: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setErrors(results.errors.map(error => error.message));
            return;
          }
          
          setCsvData(results.data as CSVRow[]);
          setCsvHeaders(results.meta.fields || []);
          setErrors([]);
        },
        error: (error) => {
          setErrors([error.message]);
        }
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1
  });

  const validateData = () => {
    const validationErrors: string[] = [];
    const processedGuests: any[] = [];

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
      if (columnMapping.email) {
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
      if (columnMapping.phone) {
        const phone = row[columnMapping.phone]?.trim();
        if (phone) {
          guest.phone = phone;
        }
      }

      // Marketing opt-in
      if (columnMapping.opt_in_marketing) {
        const optIn = row[columnMapping.opt_in_marketing]?.trim().toLowerCase();
        guest.opt_in_marketing = ['true', '1', 'yes', 'y'].includes(optIn);
      } else {
        guest.opt_in_marketing = false;
      }

      // Notes
      if (columnMapping.notes) {
        const notes = row[columnMapping.notes]?.trim();
        if (notes) {
          guest.notes = notes;
        }
      }

      processedGuests.push(guest);
    });

    return { errors: validationErrors, guests: processedGuests };
  };

  const handleImport = async () => {
    const { errors: validationErrors, guests } = validateData();
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await onImport(guests);
      onOpenChange(false);
      
      // Reset state
      setCsvData([]);
      setCsvHeaders([]);
      setColumnMapping({ name: '', email: '', phone: '', opt_in_marketing: '', notes: '' });
    } catch (error) {
      setErrors(['Failed to import guests. Please try again.']);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const canImport = csvData.length > 0 && columnMapping.name && !isProcessing;

  return (
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
                    CSV files only
                  </p>
                </div>
              )}
            </div>
          </div>

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
                  <Label htmlFor="marketing-mapping">Marketing Opt-in</Label>
                  <Select value={columnMapping.opt_in_marketing} onValueChange={(value) => 
                    setColumnMapping({ ...columnMapping, opt_in_marketing: value })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column for Marketing Opt-in" />
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
                  {csvData.slice(0, 5).map((row, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 text-xs">
                      <div><strong>Name:</strong> {row[columnMapping.name]}</div>
                      <div><strong>Email:</strong> {columnMapping.email ? row[columnMapping.email] : '—'}</div>
                      <div><strong>Phone:</strong> {columnMapping.phone ? row[columnMapping.phone] : '—'}</div>
                      <div><strong>Marketing:</strong> {columnMapping.opt_in_marketing ? row[columnMapping.opt_in_marketing] : '—'}</div>
                    </div>
                  ))}
                  {csvData.length > 5 && (
                    <div className="text-muted-foreground">... and {csvData.length - 5} more</div>
                  )}
                </div>
              </div>
            </div>
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
              <Label>Importing guests...</Label>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!canImport}>
              {isProcessing ? 'Importing...' : `Import ${csvData.length} Guests`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
