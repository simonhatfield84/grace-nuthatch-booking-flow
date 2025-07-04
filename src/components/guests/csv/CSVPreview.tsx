
import React from "react";
import { Label } from "@/components/ui/label";
import { CSVRow, ColumnMapping } from "@/types/guest";

interface CSVPreviewProps {
  data: CSVRow[];
  columnMapping: ColumnMapping;
}

export const CSVPreview = ({ data, columnMapping }: CSVPreviewProps) => {
  if (data.length === 0 || columnMapping.name === 'none') {
    return null;
  }

  return (
    <div>
      <Label>Preview ({data.length} guests)</Label>
      <div className="mt-2 border rounded-lg p-4 bg-muted/20 max-h-40 overflow-y-auto">
        <div className="text-sm space-y-2">
          {data.slice(0, 3).map((row, index) => (
            <div key={index} className="grid grid-cols-3 gap-2 text-xs">
              <div><strong>Name:</strong> {row[columnMapping.name]}</div>
              <div><strong>Email:</strong> {columnMapping.email !== 'none' ? row[columnMapping.email] : '—'}</div>
              <div><strong>Phone:</strong> {columnMapping.phone !== 'none' ? row[columnMapping.phone] : '—'}</div>
            </div>
          ))}
          {data.length > 3 && (
            <div className="text-muted-foreground">... and {data.length - 3} more</div>
          )}
        </div>
      </div>
    </div>
  );
};
