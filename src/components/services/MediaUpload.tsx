
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, X, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MediaUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
  onRemove: () => void;
}

export const MediaUpload = ({ imageUrl, onImageChange, onRemove }: MediaUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateImage = (file: File): string | null => {
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return "Image must be smaller than 5MB";
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return "Only JPG, PNG, and WebP images are supported";
    }

    return null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      toast({
        title: "Invalid image",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `service-images/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      onImageChange(data.publicUrl);
      
      toast({
        title: "Image uploaded",
        description: "Your service image has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // If it's a Supabase Storage URL, try to delete the file
    if (imageUrl.includes('supabase')) {
      try {
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `service-images/${fileName}`;
        
        await supabase.storage
          .from('service-images')
          .remove([filePath]);
      } catch (error) {
        console.warn('Failed to delete file from storage:', error);
      }
    }
    
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChooseImage = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleTooltipClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label>Service Image</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                type="button"
                onClick={handleTooltipClick}
                className="inline-flex items-center justify-center"
              >
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2 text-sm">
                <p><strong>Optimal size:</strong> 1200x800px (3:2 aspect ratio)</p>
                <p><strong>Mobile display:</strong> Cropped to 16:9 for mobile cards</p>
                <p><strong>Desktop display:</strong> Full 3:2 aspect ratio maintained</p>
                <p><strong>File limits:</strong> JPG, PNG, WebP under 5MB</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {imageUrl ? (
        <Card className="relative overflow-hidden">
          <div className="aspect-video bg-muted bg-cover bg-center relative" 
               style={{ backgroundImage: `url(${imageUrl})` }}>
            {/* Desktop crop indicator */}
            <div className="absolute inset-0 border-2 border-blue-400 border-dashed opacity-60">
              <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                Desktop (3:2)
              </div>
            </div>
            {/* Mobile crop indicator */}
            <div className="absolute inset-x-0 top-0 bottom-0 border-2 border-green-400 border-dashed opacity-60 mx-8">
              <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                Mobile (16:9)
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
          <div className="aspect-video flex flex-col items-center justify-center p-6">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center mb-3">
              Upload a service image
            </p>
            <Button 
              type="button"
              variant="outline" 
              onClick={handleChooseImage}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Choose Image"}
            </Button>
          </div>
        </Card>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};
