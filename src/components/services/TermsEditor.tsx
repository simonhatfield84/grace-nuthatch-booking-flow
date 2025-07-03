
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered } from "lucide-react";

interface TermsEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const TermsEditor = ({ value, onChange }: TermsEditorProps) => {
  const [selectedText, setSelectedText] = useState('');

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.getElementById('terms-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const formatButtons = [
    { 
      icon: Bold, 
      action: () => insertFormatting('**', '**'),
      tooltip: 'Bold'
    },
    { 
      icon: Italic, 
      action: () => insertFormatting('_', '_'),
      tooltip: 'Italic'
    },
    { 
      icon: List, 
      action: () => insertFormatting('\n- '),
      tooltip: 'Bullet List'
    },
    { 
      icon: ListOrdered, 
      action: () => insertFormatting('\n1. '),
      tooltip: 'Numbered List'
    }
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="terms-textarea">Terms & Conditions</Label>
      <div className="border rounded-md">
        <div className="flex gap-1 p-2 border-b bg-muted/50">
          {formatButtons.map((button, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={button.action}
              title={button.tooltip}
              className="h-8 w-8 p-0"
            >
              <button.icon className="h-3 w-3" />
            </Button>
          ))}
        </div>
        <Textarea
          id="terms-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your service terms and conditions here. You can use **bold**, _italic_, and lists."
          className="min-h-[120px] border-0 focus-visible:ring-0"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Use **bold** for bold text, _italic_ for italic text, and - for bullet points.
      </p>
    </div>
  );
};
