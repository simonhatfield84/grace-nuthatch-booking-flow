import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SafeHtml } from '@/components/SafeHtml';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
  venueName: string;
  aboutContent: string;
  media?: Array<{ path: string; type: string; }>;
}

export function AboutModal({ open, onClose, venueName, aboutContent, media }: AboutModalProps) {
  const aboutMedia = media?.filter(m => m.type === 'about') || [];
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>About {venueName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {aboutMedia.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {aboutMedia.map((item, idx) => (
                <img 
                  key={idx}
                  src={item.path}
                  alt={`${venueName} ${idx + 1}`}
                  className="w-full h-40 object-cover rounded-lg"
                />
              ))}
            </div>
          )}
          
          <SafeHtml html={aboutContent} className="prose prose-sm max-w-none" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
