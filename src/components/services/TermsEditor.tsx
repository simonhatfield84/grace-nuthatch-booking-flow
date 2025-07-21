
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import DOMPurify from 'dompurify';

interface TermsEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export const TermsEditor = ({ value, onChange, maxLength = 50000 }: TermsEditorProps) => {
  const [selectedText, setSelectedText] = useState('');

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.getElementById('terms-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    // Security: Validate length and content
    if (newText.length > maxLength) {
      return; // Prevent exceeding max length
    }
    
    // Additional XSS protection - sanitize content
    const sanitizedText = DOMPurify.sanitize(newText, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: ['class'],
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'iframe'],
      FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'javascript:']
    });
    
    onChange(sanitizedText);

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
          onChange={(e) => {
            const newValue = e.target.value;
            // Security: Prevent exceeding max length
            if (newValue.length <= maxLength) {
              onChange(newValue);
            }
          }}
          placeholder="Enter your service terms and conditions here. You can use **bold**, _italic_, and lists."
          className="min-h-[120px] border-0 focus-visible:ring-0"
          maxLength={maxLength}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Use **bold** for bold text, _italic_ for italic text, and - for bullet points.</span>
        <span className={value.length > maxLength * 0.9 ? "text-warning" : ""}>{value.length}/{maxLength} characters</span>
      </div>
    </div>
  );
};
