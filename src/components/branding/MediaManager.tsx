import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Upload, GripVertical } from "lucide-react";
import { uploadMediaWithVariants, deleteMedia } from "@/services/mediaUploadService";

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

      {media.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-muted-foreground">No images uploaded yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {media.map((item) => (
            <Card key={item.id} className="relative overflow-hidden group">
              <img
                src={getPublicUrl(item.path)}
                alt={`${type} image`}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(item.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute top-2 left-2 cursor-move">
                <GripVertical className="h-5 w-5 text-white drop-shadow-lg" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Recommended: {type === 'hero' ? '1600x900px' : '800x600px'} • Max 5MB • PNG, JPEG, WebP
      </p>
    </div>
  );
}
