
import React from "react";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface CSVFileUploadProps {
  onFileUpload: (file: File) => void;
}

export const CSVFileUpload = ({ onFileUpload }: CSVFileUploadProps) => {
  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  return (
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
  );
};
