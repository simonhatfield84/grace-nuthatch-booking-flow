import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Info } from "lucide-react";
import { uploadMediaWithVariants, deleteMedia } from "@/services/mediaUploadService";
import { ImagePreviewWithSafeAreas } from "./ImagePreviewWithSafeAreas";

interface MediaManagerProps {
  venueId: string;
  type: 'hero' | 'about';
  label: string;
}

interface MediaItem {
  id: string;
  path: string;
  width: number | null;
  height: number | null;
  sort_order: number;
}

export function MediaManager({ venueId, type, label }: MediaManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: media = [], isLoading } = useQuery({
    queryKey: ['venue-media', venueId, type],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('venue_media')
        .select('id, path, width, height, sort_order')
        .eq('venue_id', venueId)
        .eq('type', type)
        .order('sort_order');

      if (error) throw error;
      return data as MediaItem[];
    },
    enabled: !!venueId
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-media', venueId, type] });
      toast({ title: "Image deleted", description: "Media removed successfully." });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Images must be under 5MB",
        variant: "destructive"
      });
      return;
    }

    // Validate MIME type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PNG, JPEG, and WebP images are allowed",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const nextSortOrder = media.length;
      await uploadMediaWithVariants(venueId, type, file, nextSortOrder);
      queryClient.invalidateQueries({ queryKey: ['venue-media', venueId, type] });
      toast({
        title: "Upload successful",
        description: "Image uploaded with responsive variants"
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getPublicUrl = (path: string) => {
    const bucket = type === 'hero' ? 'brand-hero' : 'brand-about';
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Educational Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Device Preview:</strong> Use the device tabs on each image to see how it will appear 
          on different screen sizes. Content inside the blue safe area is always visible.
        </AlertDescription>
      </Alert>

      {/* Upload Section */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => document.getElementById(`upload-${type}`)?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="ml-2">Upload</span>
        </Button>
        <input
          id={`upload-${type}`}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Aspect Ratio Guidance */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <h4 className="font-semibold text-sm mb-2">📐 Recommended Aspect Ratios</h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li><strong>Hero Images:</strong> 16:9 (1600x900px) - Works well across all devices</li>
            <li><strong>About Images:</strong> 4:3 (1200x900px) - Optimized for gallery display</li>
            <li><strong>Safe Content:</strong> Keep important elements (faces, text, logos) within the center area</li>
          </ul>
        </CardContent>
      </Card>

      {/* Media Grid */}
      {media.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-muted-foreground">No images uploaded yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {media.map((item) => (
            <ImagePreviewWithSafeAreas
              key={item.id}
              imageUrl={getPublicUrl(item.path)}
              imageWidth={item.width || 1600}
              imageHeight={item.height || 900}
              onDelete={() => deleteMutation.mutate(item.id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <strong>Recommended:</strong> {type === 'hero' ? '1600x900px (16:9)' : '1200x900px (4:3)'} • 
        <strong>Max 5MB</strong> • PNG, JPEG, WebP
      </p>
    </div>
  );
}
