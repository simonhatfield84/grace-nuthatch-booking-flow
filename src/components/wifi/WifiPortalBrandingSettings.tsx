
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Eye, Palette, Loader2 } from "lucide-react";

interface BrandingSettings {
  logo_url: string;
  background_image_url: string;
  font_family: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  custom_css: string;
}

export const WifiPortalBrandingSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['wifi-branding-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wifi_settings')
        .select('logo_url, background_image_url, font_family, primary_color, secondary_color, accent_color, custom_css')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
  });

  const [formData, setFormData] = useState<BrandingSettings>({
    logo_url: '',
    background_image_url: '',
    font_family: 'Playfair Display',
    primary_color: '#2B3840',
    secondary_color: '#384140',
    accent_color: '#FFFFFF',
    custom_css: ''
  });

  React.useEffect(() => {
    if (settings) {
      setFormData({
        logo_url: settings.logo_url || '',
        background_image_url: settings.background_image_url || '',
        font_family: settings.font_family || 'Playfair Display',
        primary_color: settings.primary_color || '#2B3840',
        secondary_color: settings.secondary_color || '#384140',
        accent_color: settings.accent_color || '#FFFFFF',
        custom_css: settings.custom_css || ''
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: BrandingSettings) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .single();
      
      if (!profile?.venue_id) {
        throw new Error('No venue found for user');
      }

      const { error } = await supabase
        .from('wifi_settings')
        .upsert({
          venue_id: profile.venue_id,
          ...data
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wifi-branding-settings'] });
      toast({
        title: "Branding settings saved",
        description: "Your WiFi portal branding has been updated successfully.",
      });
      setIsSaving(false);
    },
    onError: (error) => {
      console.error('Error saving branding settings:', error);
      toast({
        title: "Error",
        description: "Failed to save branding settings. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    saveMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof BrandingSettings, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Portal Branding & Design
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Portal Branding & Design
        </CardTitle>
        <CardDescription>
          Customize the look and feel of your WiFi portal page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input
            id="logo_url"
            value={formData.logo_url}
            onChange={(e) => handleInputChange('logo_url', e.target.value)}
            placeholder="https://example.com/logo.svg"
          />
          <p className="text-sm text-muted-foreground">
            SVG format recommended. Optimal size: 200x80px. Will be displayed centered at the top of the portal.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="background_image_url">Background Image URL</Label>
          <Input
            id="background_image_url"
            value={formData.background_image_url}
            onChange={(e) => handleInputChange('background_image_url', e.target.value)}
            placeholder="https://example.com/background.jpg"
          />
          <p className="text-sm text-muted-foreground">
            High-resolution JPG/PNG recommended. Optimal size: 1920x1080px. Will be used as portal background.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="font_family">Font Family</Label>
          <Select value={formData.font_family} onValueChange={(value) => handleInputChange('font_family', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Playfair Display">Playfair Display (Elegant serif)</SelectItem>
              <SelectItem value="Inter">Inter (Modern sans-serif)</SelectItem>
              <SelectItem value="Lora">Lora (Readable serif)</SelectItem>
              <SelectItem value="Poppins">Poppins (Friendly sans-serif)</SelectItem>
              <SelectItem value="Crimson Text">Crimson Text (Classical serif)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                value={formData.primary_color}
                onChange={(e) => handleInputChange('primary_color', e.target.value)}
                placeholder="#2B3840"
              />
              <input
                type="color"
                value={formData.primary_color}
                onChange={(e) => handleInputChange('primary_color', e.target.value)}
                className="w-12 h-10 border border-input rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_color">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondary_color"
                value={formData.secondary_color}
                onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                placeholder="#384140"
              />
              <input
                type="color"
                value={formData.secondary_color}
                onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                className="w-12 h-10 border border-input rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accent_color">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                id="accent_color"
                value={formData.accent_color}
                onChange={(e) => handleInputChange('accent_color', e.target.value)}
                placeholder="#FFFFFF"
              />
              <input
                type="color"
                value={formData.accent_color}
                onChange={(e) => handleInputChange('accent_color', e.target.value)}
                className="w-12 h-10 border border-input rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom_css">Custom CSS</Label>
          <Textarea
            id="custom_css"
            value={formData.custom_css}
            onChange={(e) => handleInputChange('custom_css', e.target.value)}
            placeholder="/* Additional custom styles for the portal page */"
            rows={6}
          />
          <p className="text-sm text-muted-foreground">
            Advanced: Add custom CSS to further customize the portal appearance
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview Portal
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Branding Settings"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
