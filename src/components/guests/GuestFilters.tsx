
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarIcon, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { useTags } from "@/hooks/useTags";

export interface GuestFilters {
  search: string;
  tags: string[];
  marketingOptIn: string;
  visitCount: string;
  lastVisitAfter: Date | null;
  lastVisitBefore: Date | null;
}

interface GuestFiltersProps {
  filters: GuestFilters;
  onFiltersChange: (filters: GuestFilters) => void;
  onClearFilters: () => void;
}

export const GuestFilters = ({ filters, onFiltersChange, onClearFilters }: GuestFiltersProps) => {
  const { tags } = useTags();
  const [isOpen, setIsOpen] = useState(false);
  
  const updateFilter = (key: keyof GuestFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleTag = (tagId: string) => {
    const newTags = filters.tags.includes(tagId)
      ? filters.tags.filter(id => id !== tagId)
      : [...filters.tags, tagId];
    updateFilter('tags', newTags);
  };

  const hasActiveFilters = () => {
    return filters.search ||
           filters.tags.length > 0 ||
           filters.marketingOptIn !== 'all' ||
           filters.visitCount !== 'all' ||
           filters.lastVisitAfter ||
           filters.lastVisitBefore;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.tags.length > 0) count++;
    if (filters.marketingOptIn !== 'all') count++;
    if (filters.visitCount !== 'all') count++;
    if (filters.lastVisitAfter || filters.lastVisitBefore) count++;
    return count;
  };

  const getFiltersSummary = () => {
    const summary = [];
    if (filters.search) summary.push(`Search: "${filters.search}"`);
    if (filters.tags.length > 0) summary.push(`${filters.tags.length} tag(s)`);
    if (filters.marketingOptIn !== 'all') summary.push(`Marketing: ${filters.marketingOptIn}`);
    if (filters.visitCount !== 'all') summary.push(`Visits: ${filters.visitCount}`);
    if (filters.lastVisitAfter || filters.lastVisitBefore) summary.push('Date range');
    return summary.join(', ');
  };

  return (
    <div className="space-y-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters() && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        {hasActiveFilters() && !isOpen && (
          <div className="text-sm text-muted-foreground mt-2 px-3">
            Active filters: {getFiltersSummary()}
          </div>
        )}

        <CollapsibleContent>
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20 mt-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Filter Options</span>
              {hasActiveFilters() && (
                <Button variant="outline" size="sm" onClick={onClearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="text-sm font-medium mb-1 block">Search</label>
                <Input
                  placeholder="Name, email, or phone..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
              </div>

              {/* Marketing Opt-in */}
              <div>
                <label className="text-sm font-medium mb-1 block">Marketing Opt-in</label>
                <Select value={filters.marketingOptIn} onValueChange={(value) => updateFilter('marketingOptIn', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Guests</SelectItem>
                    <SelectItem value="opted_in">Opted In</SelectItem>
                    <SelectItem value="opted_out">Opted Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Visit Count */}
              <div>
                <label className="text-sm font-medium mb-1 block">Visit Count</label>
                <Select value={filters.visitCount} onValueChange={(value) => updateFilter('visitCount', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Guests</SelectItem>
                    <SelectItem value="first_time">First-time (1 visit)</SelectItem>
                    <SelectItem value="repeat">Repeat (2-4 visits)</SelectItem>
                    <SelectItem value="frequent">Frequent (5+ visits)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Last Visit Date Range */}
              <div>
                <label className="text-sm font-medium mb-1 block">Last Visit</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.lastVisitAfter ? format(filters.lastVisitAfter, "MMM d") : "After"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.lastVisitAfter || undefined}
                        onSelect={(date) => updateFilter('lastVisitAfter', date || null)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.lastVisitBefore ? format(filters.lastVisitBefore, "MMM d") : "Before"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.lastVisitBefore || undefined}
                        onSelect={(date) => updateFilter('lastVisitBefore', date || null)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Tags Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = filters.tags.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer hover:opacity-80"
                      style={isSelected ? { backgroundColor: tag.color, borderColor: tag.color } : { borderColor: tag.color, color: tag.color }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                      {tag.is_automatic && (
                        <span className="ml-1 text-xs opacity-70">(auto)</span>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
