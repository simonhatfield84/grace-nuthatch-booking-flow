
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Copy, Palette } from "lucide-react";
import { EmailTemplate } from "@/hooks/useEmailTemplates";

interface CopyDesignDropdownProps {
  targetTemplate: EmailTemplate;
  availableTemplates: EmailTemplate[];
  onCopyDesign: (sourceTemplateId: string, targetTemplateId: string) => Promise<void>;
}

export function CopyDesignDropdown({ targetTemplate, availableTemplates, onCopyDesign }: CopyDesignDropdownProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedSourceTemplate, setSelectedSourceTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter templates that have design_json and are not the target template
  const copyableTemplates = availableTemplates.filter(t => 
    t.design_json && 
    t.id !== targetTemplate.id
  );

  const handleCopyRequest = (sourceTemplate: EmailTemplate) => {
    setSelectedSourceTemplate(sourceTemplate);
    setShowConfirmDialog(true);
  };

  const handleConfirmCopy = async () => {
    if (!selectedSourceTemplate) return;
    
    try {
      setIsLoading(true);
      await onCopyDesign(selectedSourceTemplate.id, targetTemplate.id);
      setShowConfirmDialog(false);
      setSelectedSourceTemplate(null);
    } catch (error) {
      console.error('Error copying design:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setSelectedSourceTemplate(null);
  };

  if (copyableTemplates.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Copy className="h-3 w-3 mr-1" />
            Copy Design From
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {copyableTemplates.map((template) => (
            <DropdownMenuItem
              key={template.id}
              onClick={() => handleCopyRequest(template)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Palette className="h-3 w-3 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {template.template_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {template.subject}
                </div>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Only templates with visual designs are shown
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copy Template Design</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to copy the design from "{selectedSourceTemplate?.template_key.replace(/_/g, ' ')}" 
              to "{targetTemplate.template_key.replace(/_/g, ' ')}"?
              <br /><br />
              <strong>This will overwrite the current design and content of the target template.</strong>
              The subject line will remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmCopy}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? 'Copying...' : 'Copy Design'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
