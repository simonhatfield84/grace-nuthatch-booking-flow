
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MediaUploadProps {
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  onMediaChange: (url: string, type: 'image' | 'video') => void;
  onRemove: () => void;
}

export const MediaUpload = ({ mediaUrl, mediaType, onMediaChange, onRemove }: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('service-media')
        .getPublicUrl(filePath);

      const type = file.type.startsWith('video/') ? 'video' : 'image';
      onMediaChange(data.publicUrl, type);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      // Simple type detection based on URL
      const type = urlInput.includes('video') || urlInput.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image';
      onMediaChange(urlInput.trim(), type);
      setUrlInput('');
    }
  };

  return (
    <div className="space-y-4">
      <Label>Service Media</Label>
      
      {mediaUrl ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mediaType === 'video' ? (
                  <video src={mediaUrl} className="w-16 h-16 object-cover rounded" controls />
                ) : (
                  <img src={mediaUrl} alt="Service media" className="w-16 h-16 object-cover rounded" />
                )}
                <div>
                  <p className="text-sm font-medium capitalize">{mediaType}</p>
                  <a 
                    href={mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View full size <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* File Upload */}
          <div>
            <Label htmlFor="media-upload" className="text-sm">Upload File</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="media-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="flex-1"
              />
              {uploading && (
                <div className="text-sm text-muted-foreground">Uploading...</div>
              )}
            </div>
          </div>

          {/* URL Input */}
          <div>
            <Label className="text-sm">Or enter URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1"
              />
              <Button 
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
