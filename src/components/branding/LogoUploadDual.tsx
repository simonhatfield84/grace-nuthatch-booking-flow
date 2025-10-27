import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";
import { uploadLogo } from "@/services/mediaUploadService";
import { supabase } from "@/integrations/supabase/client";

interface LogoUploadDualProps {
  venueId: string;
  logoLight: string | null;
  logoDark: string | null;
  onUpdate: (variant: 'light' | 'dark', url: string | null) => void;
}

export function LogoUploadDual({ venueId, logoLight, logoDark, onUpdate }: LogoUploadDualProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingLight, setUploadingLight] = useState(false);
  const [uploadingDark, setUploadingDark] = useState(false);

  const handleUpload = async (variant: 'light' | 'dark', file: File) => {
    const setUploading = variant === 'light' ? setUploadingLight : setUploadingDark;

    // Validate file size (2MB for logos)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logos must be under 2MB",
        variant: "destructive"
      });
      return;
    }

    // Validate MIME type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PNG, JPEG, WebP, and SVG logos are allowed",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const url = await uploadLogo(venueId, file, variant);
      
      // Update venue_branding table
      const { error: dbError } = await supabase
        .from('venue_branding')
        .update({
          [`logo_${variant}`]: url
        })
        .eq('venue_id', venueId);

      if (dbError) throw new Error('Failed to update branding settings');
      
      onUpdate(variant, url);
      queryClient.invalidateQueries({ queryKey: ['venue-branding', venueId] });
      
      toast({
        title: "Logo uploaded",
        description: `${variant === 'light' ? 'Light' : 'Dark'} logo updated successfully`
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

  const handleFileSelect = (variant: 'light' | 'dark') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(variant, file);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Light Logo */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Light Logo (for dark backgrounds)</label>
        <Card className="p-6 bg-slate-900 border-slate-700">
          {logoLight ? (
            <div className="relative group">
              <img
                src={logoLight}
                alt="Light logo"
                className="max-h-20 mx-auto"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onUpdate('light', null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-600 rounded">
              <p className="text-sm text-slate-400">No logo uploaded</p>
            </div>
          )}
        </Card>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={uploadingLight}
          onClick={() => document.getElementById('upload-logo-light')?.click()}
        >
          {uploadingLight ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="ml-2">Upload Light Logo</span>
        </Button>
        <p className="text-xs text-muted-foreground">
          Recommended: 400×100px • Max 2MB • PNG, SVG preferred
        </p>
        <input
          id="upload-logo-light"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileSelect('light')}
        />
      </div>

      {/* Dark Logo */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Dark Logo (for light backgrounds)</label>
        <Card className="p-6 bg-slate-50 border-slate-200">
          {logoDark ? (
            <div className="relative group">
              <img
                src={logoDark}
                alt="Dark logo"
                className="max-h-20 mx-auto"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onUpdate('dark', null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-300 rounded">
              <p className="text-sm text-slate-600">No logo uploaded</p>
            </div>
          )}
        </Card>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={uploadingDark}
          onClick={() => document.getElementById('upload-logo-dark')?.click()}
        >
          {uploadingDark ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="ml-2">Upload Dark Logo</span>
        </Button>
        <p className="text-xs text-muted-foreground">
          Recommended: 400×100px • Max 2MB • PNG, SVG preferred
        </p>
        <input
          id="upload-logo-dark"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileSelect('dark')}
        />
      </div>
    </div>
  );
}
