
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, X, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

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
      // For now, we'll create a URL for the uploaded file
      // In a real implementation, this would upload to Supabase Storage
      const imageUrl = URL.createObjectURL(file);
      onImageChange(imageUrl);
      
      toast({
        title: "Image uploaded",
        description: "Your service image has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label>Service Image</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
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
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
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
