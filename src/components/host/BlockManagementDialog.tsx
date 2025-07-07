
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBlocks, Block } from '@/hooks/useBlocks';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';

interface BlockManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedBlock?: Block | null;
}

export const BlockManagementDialog = ({ 
  open, 
  onOpenChange, 
  selectedDate,
  selectedBlock 
}: BlockManagementDialogProps) => {
  const { blocks, deleteBlock } = useBlocks(format(selectedDate, 'yyyy-MM-dd'));
  const { toast } = useToast();
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await deleteBlock(blockId);
      toast({
        title: "Block removed",
        description: "Time slot unblocked successfully",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove block",
        variant: "destructive"
      });
    }
  };

  if (selectedBlock) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Block</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <strong>Time:</strong> {selectedBlock.start_time} - {selectedBlock.end_time}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Reason:</strong> {selectedBlock.reason || 'No reason specified'}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Tables:</strong> {selectedBlock.table_ids.length === 0 
                ? 'All tables' 
                : `${selectedBlock.table_ids.length} specific tables`}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => handleDeleteBlock(selectedBlock.id)} 
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Block
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Blocks - {format(selectedDate, 'EEEE, MMMM do, yyyy')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {blocks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No blocks for this date
            </div>
          ) : (
            <div className="space-y-2">
              {blocks.map((block) => (
                <div key={block.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">
                      {block.start_time} - {block.end_time}
                    </div>
                    <div className="text-sm text-gray-600">
                      {block.reason || 'No reason specified'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {block.table_ids.length === 0 
                        ? 'All tables' 
                        : `${block.table_ids.length} specific tables`}
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleDeleteBlock(block.id)} 
                    variant="outline" 
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
