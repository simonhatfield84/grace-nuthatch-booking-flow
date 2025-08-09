
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wifi, Save, Loader2, Upload, Image, Palette } from "lucide-react";

interface WifiSettingsData {
  network_name: string;
  welcome_message: string;
  venue_description: string;
  terms_content: string;
  session_duration_hours: number;
  is_enabled: boolean;
  logo_url: string;
  background_image_url: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  custom_css: string;
}

const fontOptions = [
  { value: 'Playfair Display', label: 'Playfair Display (Elegant Serif)' },
  { value: 'Inter', label: 'Inter (Modern Sans)' },
  { value: 'Crimson Text', label: 'Crimson Text (Classic Serif)' },
  { value: 'Montserrat', label: 'Montserrat (Clean Sans)' },
  { value: 'Lora', label: 'Lora (Readable Serif)' },
];

export const WifiPortalSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['wifi-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wifi_settings')
        .select('*')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
  });

  const [formData, setFormData] = useState<WifiSettingsData>({
    network_name: '',
    welcome_message: 'Welcome to The Nuthatch Guest WiFi',
    venue_description: '',
    terms_content: 'By accessing our WiFi network, you agree to use it responsibly and in accordance with applicable laws. We collect basic device information for network security and analytics.',
    session_duration_hours: 24,
    is_enabled: false,
    logo_url: '',
    background_image_url: '',
    primary_color: '#2B3840',
    secondary_color: '#384140',
    font_family: 'Playfair Display',
    custom_css: ''
  });

  // Update form data when settings load
  React.useEffect(() => {
    if (settings) {
      setFormData({
        network_name: settings.network_name || '',
        welcome_message: settings.welcome_message || 'Welcome to The Nuthatch Guest WiFi',
        venue_description: settings.venue_description || '',
        terms_content: settings.terms_content || 'By accessing our WiFi network, you agree to use it responsibly and in accordance with applicable laws. We collect basic device information for network security and analytics.',
        session_duration_hours: settings.session_duration_hours || 24,
        is_enabled: settings.is_enabled || false,
        logo_url: settings.logo_url || '',
        background_image_url: settings.background_image_url || '',
        primary_color: settings.primary_color || '#2B3840',
        secondary_color: settings.secondary_color || '#384140',
        font_family: settings.font_family || 'Playfair Display',
        custom_css: settings.custom_css || ''
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: WifiSettingsData) => {
      // Get current user's venue ID
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
      queryClient.invalidateQueries({ queryKey: ['wifi-settings'] });
      toast({
        title: "WiFi portal settings saved",
        description: "Your WiFi portal settings have been updated successfully.",
      });
      setIsSaving(false);
    },
    onError: (error) => {
      console.error('Error saving WiFi settings:', error);
      toast({
        title: "Error",
        description: "Failed to save WiFi portal settings. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    saveMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof WifiSettingsData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (file: File, field: 'logo_url' | 'background_image_url') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName);

      handleInputChange(field, publicUrl);
      
      toast({
        title: "Image uploaded",
        description: "Image has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            WiFi Portal Configuration
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Portal Configuration
          </CardTitle>
          <CardDescription>
            Configure your venue's WiFi portal settings and branding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Enable WiFi Portal</Label>
              <p className="text-sm text-muted-foreground">
                Turn on/off the WiFi portal system
              </p>
            </div>
            <Switch
              id="enabled"
              checked={formData.is_enabled}
              onCheckedChange={(checked) => handleInputChange('is_enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="network_name">Network Name (SSID)</Label>
            <Input
              id="network_name"
              value={formData.network_name}
              onChange={(e) => handleInputChange('network_name', e.target.value)}
              placeholder="Enter your WiFi network name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcome_message">Welcome Message</Label>
            <Input
              id="welcome_message"
              value={formData.welcome_message}
              onChange={(e) => handleInputChange('welcome_message', e.target.value)}
              placeholder="Welcome to The Nuthatch Guest WiFi"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue_description">Venue Description</Label>
            <Textarea
              id="venue_description"
              value={formData.venue_description}
              onChange={(e) => handleInputChange('venue_description', e.target.value)}
              placeholder="Brief description of your venue"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session_duration">Session Duration (hours)</Label>
            <Input
              id="session_duration"
              type="number"
              min="1"
              max="168"
              value={formData.session_duration_hours}
              onChange={(e) => handleInputChange('session_duration_hours', parseInt(e.target.value) || 24)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_content">Terms & Conditions</Label>
            <Textarea
              id="terms_content"
              value={formData.terms_content}
              onChange={(e) => handleInputChange('terms_content', e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Portal Branding
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your WiFi portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Logo Upload</Label>
            <div className="flex items-center gap-4">
              {formData.logo_url && (
                <img src={formData.logo_url} alt="Logo" className="h-12 w-auto" />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'logo_url');
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Recommended: SVG format, max 200px height, transparent background
            </p>
          </div>

          <div className="space-y-2">
            <Label>Background Image</Label>
            <div className="flex items-center gap-4">
              {formData.background_image_url && (
                <img src={formData.background_image_url} alt="Background" className="h-20 w-32 object-cover rounded" />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'background_image_url');
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Recommended: 1920x1080px, JPEG/PNG, subtle/blurred images work best
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <Input
                id="primary_color"
                type="color"
                value={formData.primary_color}
                onChange={(e) => handleInputChange('primary_color', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <Input
                id="secondary_color"
                type="color"
                value={formData.secondary_color}
                onChange={(e) => handleInputChange('secondary_color', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font_family">Font Family</Label>
            <Select
              value={formData.font_family}
              onValueChange={(value) => handleInputChange('font_family', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom_css">Custom CSS (Advanced)</Label>
            <Textarea
              id="custom_css"
              value={formData.custom_css}
              onChange={(e) => handleInputChange('custom_css', e.target.value)}
              placeholder="Add custom CSS to further customize your portal..."
              rows={4}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          {settings?.created_at && 
            `Last saved: ${new Date(settings.created_at).toLocaleString()}`
          }
        </p>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
