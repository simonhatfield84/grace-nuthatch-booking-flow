
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";

interface ServiceBasicInfoProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export const ServiceBasicInfo = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange
}: ServiceBasicInfoProps) => {
  return (
    <TabsContent value="basic" className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Service Title</Label>
          <Input
            type="text"
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>
      </div>
    </TabsContent>
  );
};
