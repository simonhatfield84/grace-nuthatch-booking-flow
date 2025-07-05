
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Tag as TagIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

const colorOptions = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export const TagSelector = ({ selectedTagIds, onTagsChange }: TagSelectorProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTag, setNewTag] = useState({ name: "", color: "#3B82F6" });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get user's venue ID
  const { data: userVenue } = useQuery({
    queryKey: ['user-venue', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.venue_id;
    },
    enabled: !!user,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const createTagMutation = useMutation({
    mutationFn: async (tag: { name: string; color: string }) => {
      if (!userVenue) {
        throw new Error('No venue associated with user');
      }

      const { data, error } = await supabase
        .from('tags')
        .insert([{ ...tag, venue_id: userVenue }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      onTagsChange([...selectedTagIds, data.id]);
      setNewTag({ name: "", color: "#3B82F6" });
      setShowCreateDialog(false);
      toast({
        title: "Tag created",
        description: "New tag has been created and added to this service.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleTagToggle = (tagId: string, checked: boolean) => {
    if (checked) {
      onTagsChange([...selectedTagIds, tagId]);
    } else {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    }
  };

  const handleCreateTag = () => {
    if (!newTag.name.trim()) return;
    createTagMutation.mutate(newTag);
  };

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));

  return (
    <div className="space-y-3">
      <Label>Tags</Label>
      
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Selection */}
      {tags.length > 0 ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={selectedTagIds.includes(tag.id)}
                  onCheckedChange={(checked) => handleTagToggle(tag.id, !!checked)}
                />
                <label
                  htmlFor={`tag-${tag.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No tags available</p>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowCreateDialog(true)}
        className="w-full"
        disabled={!userVenue}
      >
        <Plus className="h-3 w-3 mr-2" />
        Create New Tag
      </Button>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newTagName">Tag Name</Label>
              <Input
                id="newTagName"
                value={newTag.name}
                onChange={(e) => setNewTag({...newTag, name: e.target.value})}
                placeholder="e.g., Dinner, Seasonal, Special"
              />
            </div>
            
            <div>
              <Label>Color</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      newTag.color === color ? 'border-primary' : 'border-muted'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTag({...newTag, color})}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateTag}
                disabled={!newTag.name.trim() || createTagMutation.isPending || !userVenue}
              >
                Create & Add to Service
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
