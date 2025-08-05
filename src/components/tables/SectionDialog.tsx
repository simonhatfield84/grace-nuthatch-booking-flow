import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSections } from "@/hooks/useSections";

interface Section {
  id: number;
  name: string;
  description?: string;
  color?: string;
  sort_order: number;
}

interface SectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingSection?: Section | null;
  onSectionSaved?: () => void;
}

export const SectionDialog = ({ 
  isOpen, 
  onOpenChange, 
  editingSection,
  onSectionSaved 
}: SectionDialogProps) => {
  const { createSection, updateSection, sections } = useSections();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    sort_order: 0
  });

  useEffect(() => {
    if (editingSection) {
      setFormData({
        name: editingSection.name,
        description: editingSection.description || "",
        color: editingSection.color || "#3B82F6",
        sort_order: editingSection.sort_order
      });
    } else {
      // Calculate next sort order for new sections
      const maxSortOrder = sections.reduce((max, section) => 
        Math.max(max, section.sort_order || 0), 0
      );
      setFormData({
        name: "",
        description: "",
        color: "#3B82F6",
        sort_order: maxSortOrder + 1
      });
    }
  }, [editingSection, isOpen, sections]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSection) {
        await updateSection({
          id: editingSection.id,
          updates: formData
        });
      } else {
        await createSection(formData);
      }
      
      onOpenChange(false);
      onSectionSaved?.();
    } catch (error) {
      console.error('Error saving section:', error);
    }
  };

  const colorOptions = [
    { value: "#3B82F6", label: "Blue" },
    { value: "#10B981", label: "Green" },
    { value: "#F59E0B", label: "Amber" },
    { value: "#EF4444", label: "Red" },
    { value: "#8B5CF6", label: "Purple" },
    { value: "#06B6D4", label: "Cyan" },
    { value: "#84CC16", label: "Lime" },
    { value: "#F97316", label: "Orange" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingSection ? 'Edit Section' : 'Create New Section'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Section Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter section name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter section description"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color.value ? 'border-gray-900' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  title={color.label}
                />
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingSection ? 'Update Section' : 'Create Section'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
