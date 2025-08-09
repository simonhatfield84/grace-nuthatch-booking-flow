
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

interface ReportsFilters {
  search?: string;
  type?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface ReportsFiltersProps {
  onFiltersChange: (filters: ReportsFilters) => void;
  activeTab: string;
}

export const ReportsFilters = ({ onFiltersChange, activeTab }: ReportsFiltersProps) => {
  const [filters, setFilters] = useState<ReportsFilters>({});
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  useEffect(() => {
    const updatedFilters = {
      ...filters,
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
    };
    onFiltersChange(updatedFilters);
  }, [filters, dateFrom, dateTo]);

  const handleFilterChange = (key: keyof ReportsFilters, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || dateFrom || dateTo;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            className="pl-10"
          />
        </div>

        {/* Type/Severity Filter */}
        {activeTab === 'documents' ? (
          <Select
            value={filters.type || ''}
            onValueChange={(value) => handleFilterChange('type', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="doc">Documentation</SelectItem>
              <SelectItem value="config">Configuration</SelectItem>
              <SelectItem value="log">Log file</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Select
            value={filters.severity || ''}
            onValueChange={(value) => handleFilterChange('severity', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Log severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              disabled={(date) => 
                date > new Date() || 
                date < new Date("1900-01-01") ||
                (dateFrom && date < dateFrom)
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
