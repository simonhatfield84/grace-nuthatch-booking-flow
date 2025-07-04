
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tag } from "@/types/guest";

interface GuestTagsDisplayProps {
  tags: Tag[];
}

export const GuestTagsDisplay = ({ tags }: GuestTagsDisplayProps) => {
  if (!tags || tags.length === 0) {
    return <span className="text-xs text-muted-foreground">No tags</span>;
  }

  if (tags.length === 1) {
    return (
      <Badge
        variant="outline"
        className="text-xs"
        style={{ 
          backgroundColor: tags[0].color + '20',
          borderColor: tags[0].color,
          color: tags[0].color 
        }}
      >
        {tags[0].name}
      </Badge>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-auto p-1 text-xs">
          <Badge variant="outline" className="text-xs">
            {tags.length} tag{tags.length > 1 ? 's' : ''}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Guest Tags</h4>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs"
                style={{ 
                  backgroundColor: tag.color + '20',
                  borderColor: tag.color,
                  color: tag.color 
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
