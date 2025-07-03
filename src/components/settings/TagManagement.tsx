
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Tag as TagIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  usage_count?: number;
}

const colorOptions = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6B7280', '#1F2937', '#7C3AED'
];

export const TagManagement = () => {
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTag, setNewTag] = useState({ name: "", color: "#3B82F6" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Get usage counts for each tag
      const tagsWithUsage = await Promise.all(
        data.map(async (tag) => {
          const { data: usageData, error: usageError } = await supabase
            .rpc('get_tag_usage_count', { tag_id: tag.id });
          
          return {
            ...tag,
            usage_count: usageError ? 0 : usageData
          };
        })
      );
      
      return tagsWithUsage;
    }
  });

  const createTagMutation = useMutation({
    mutationFn: async (tag: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .insert([tag])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setNewTag({ name: "", color: "#3B82F6" });
      setShowTagDialog(false);
      toast({
        title: "Tag created",
        description: "New tag has been created successfully.",
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

  const updateTagMutation = useMutation({
    mutationFn: async (tag: Tag) => {
      const { data, error } = await supabase
        .from('tags')
        .update({ name: tag.name, color: tag.color })
        .eq('id', tag.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setEditingTag(null);
      setShowTagDialog(false);
      toast({
        title: "Tag updated",
        description: "Tag has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({
        title: "Tag deleted",
        description: "Tag has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateTag = () => {
    if (!newTag.name.trim()) return;
    createTagMutation.mutate(newTag);
  };

  const handleUpdateTag = () => {
    if (!editingTag || !editingTag.name.trim()) return;
    updateTagMutation.mutate(editingTag);
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setShowTagDialog(true);
  };

  const handleDeleteTag = (tag: Tag) => {
    if (tag.usage_count && tag.usage_count > 0) {
      toast({
        title: "Cannot delete tag",
        description: `This tag is used by ${tag.usage_count} service(s). Remove it from services first.`,
        variant: "destructive",
      });
      return;
    }
    deleteTagMutation.mutate(tag.id);
  };

  const resetForm = () => {
    setNewTag({ name: "", color: "#3B82F6" });
    setEditingTag(null);
  };

  const currentFormData = editingTag || newTag;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              Tag Management
            </CardTitle>
            <CardDescription>
              Manage service tags used across your booking system
            </CardDescription>
          </div>
          <Button onClick={() => setShowTagDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tag
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading tags...</p>
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-8">
            <TagIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tags created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-medium">{tag.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {tag.usage_count || 0}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTag(tag)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTag(tag)}
                    className="h-8 w-8 p-0 text-red-600"
                    disabled={tag.usage_count && tag.usage_count > 0}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showTagDialog} onOpenChange={(open) => {
          setShowTagDialog(open);
          if (!open) resetForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTag ? 'Edit Tag' : 'Create New Tag'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tagName">Tag Name</Label>
                <Input
                  id="tagName"
                  value={currentFormData.name}
                  onChange={(e) => editingTag
                    ? setEditingTag({...editingTag, name: e.target.value})
                    : setNewTag({...newTag, name: e.target.value})
                  }
                  placeholder="e.g., Dinner, Seasonal, Special"
                />
              </div>
              
              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        currentFormData.color === color ? 'border-primary' : 'border-muted'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => editingTag
                        ? setEditingTag({...editingTag, color})
                        : setNewTag({...newTag, color})
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={editingTag ? handleUpdateTag : handleCreateTag}
                  disabled={!currentFormData.name.trim() || createTagMutation.isPending || updateTagMutation.isPending}
                >
                  {editingTag ? 'Update Tag' : 'Create Tag'}
                </Button>
                <Button variant="outline" onClick={() => setShowTagDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
