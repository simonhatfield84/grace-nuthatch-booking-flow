
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";

interface ServiceAdvancedSettingsProps {
  active: boolean;
  isSecret: boolean;
  secretSlug: string;
  termsAndConditions: string;
  selectedTags: string[];
  tags: any[];
  isTagsLoading: boolean;
  onActiveChange: (value: boolean) => void;
  onIsSecretChange: (value: boolean) => void;
  onSecretSlugChange: (value: string) => void;
  onTermsAndConditionsChange: (value: string) => void;
  onTagToggle: (tagId: string) => void;
}

export const ServiceAdvancedSettings = ({
  active,
  isSecret,
  secretSlug,
  termsAndConditions,
  selectedTags,
  tags,
  isTagsLoading,
  onActiveChange,
  onIsSecretChange,
  onSecretSlugChange,
  onTermsAndConditionsChange,
  onTagToggle
}: ServiceAdvancedSettingsProps) => {
  return (
    <TabsContent value="advanced" className="space-y-6">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="active"
          checked={active}
          onCheckedChange={(checked) => onActiveChange(checked)}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="active">Active</Label>
          <p className="text-sm text-muted-foreground">
            Service is available for booking
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isSecret"
          checked={isSecret}
          onCheckedChange={(checked) => onIsSecretChange(checked)}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="isSecret">Secret Service</Label>
          <p className="text-sm text-muted-foreground">
            Only accessible via a secret link
          </p>
        </div>
      </div>

      {isSecret && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="secretSlug">Secret Slug</Label>
            <Input
              type="text"
              id="secretSlug"
              value={secretSlug}
              onChange={(e) => onSecretSlugChange(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {isTagsLoading ? (
            <div>Loading tags...</div>
          ) : (
            tags.map((tag) => (
              <Button
                key={tag.id}
                type="button"
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                onClick={() => onTagToggle(tag.id)}
              >
                {tag.name}
              </Button>
            ))
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
          <Textarea
            id="termsAndConditions"
            value={termsAndConditions}
            onChange={(e) => onTermsAndConditionsChange(e.target.value)}
          />
        </div>
      </div>
    </TabsContent>
  );
};
