
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColumnMapping } from "@/types/guest";

interface CSVColumnMappingProps {
  headers: string[];
  columnMapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
}

export const CSVColumnMapping = ({ headers, columnMapping, onMappingChange }: CSVColumnMappingProps) => {
  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    onMappingChange({ ...columnMapping, [field]: value });
  };

  return (
    <div>
      <Label>Map CSV Columns to Guest Fields</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <Label htmlFor="name-mapping">Name * (Required)</Label>
          <Select value={columnMapping.name} onValueChange={(value) => updateMapping('name', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select column for Name" />
            </SelectTrigger>
            <SelectContent>
              {headers.map(header => (
                <SelectItem key={header} value={header}>{header}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="email-mapping">Email</Label>
          <Select value={columnMapping.email} onValueChange={(value) => updateMapping('email', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select column for Email" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {headers.map(header => (
                <SelectItem key={header} value={header}>{header}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="phone-mapping">Phone</Label>
          <Select value={columnMapping.phone} onValueChange={(value) => updateMapping('phone', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select column for Phone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {headers.map(header => (
                <SelectItem key={header} value={header}>{header}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="marketing-mapping">Marketing Opt-in (defaults to Yes)</Label>
          <Select value={columnMapping.opt_in_marketing} onValueChange={(value) => updateMapping('opt_in_marketing', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select column for Marketing Opt-in" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (defaults to Yes)</SelectItem>
              {headers.map(header => (
                <SelectItem key={header} value={header}>{header}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="visit-count-mapping">Number of Visits</Label>
          <Select value={columnMapping.import_visit_count} onValueChange={(value) => updateMapping('import_visit_count', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select column for Visit Count" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {headers.map(header => (
                <SelectItem key={header} value={header}>{header}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="last-visit-mapping">Last Visit Date</Label>
          <Select value={columnMapping.import_last_visit_date} onValueChange={(value) => updateMapping('import_last_visit_date', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select column for Last Visit Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {headers.map(header => (
                <SelectItem key={header} value={header}>{header}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="notes-mapping">Notes</Label>
          <Select value={columnMapping.notes} onValueChange={(value) => updateMapping('notes', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select column for Notes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {headers.map(header => (
                <SelectItem key={header} value={header}>{header}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
