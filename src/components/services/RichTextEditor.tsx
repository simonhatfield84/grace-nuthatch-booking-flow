
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Link, Quote } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor = ({ 
  value, 
  onChange, 
  label, 
  placeholder = "Enter text here...",
  minHeight = "min-h-[100px]"
}: RichTextEditorProps) => {
  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.getElementById(`rich-text-${label.replace(/\s+/g, '-').toLowerCase()}`) as HTMLTextAreaElement;
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
    },
    { 
      icon: Link, 
      action: () => insertFormatting('[', '](url)'),
      tooltip: 'Link'
    },
    { 
      icon: Quote, 
      action: () => insertFormatting('\n{">"}'),
      tooltip: 'Quote'
    }
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor={`rich-text-${label.replace(/\s+/g, '-').toLowerCase()}`}>{label}</Label>
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
          id={`rich-text-${label.replace(/\s+/g, '-').toLowerCase()}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`border-0 focus-visible:ring-0 ${minHeight}`}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Use **bold**, _italic_, [links](url), {'>'}quotes, and - for bullet points.
      </p>
    </div>
  );
};
