
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWifiSettings } from "@/hooks/useWifiSettings";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface WifiBrandingSettingsProps {
  settings: any;
  venueId?: string;
}

export const WifiBrandingSettings = ({ settings, venueId }: WifiBrandingSettingsProps) => {
  const { updateSettings, isUpdating } = useWifiSettings(venueId);
  const [formData, setFormData] = useState({
    primary_color: '#000000',
    secondary_color: '#ffffff',
    accent_color: '#059669',
    font_family: 'Inter',
    custom_css: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        primary_color: settings.primary_color || '#000000',
        secondary_color: settings.secondary_color || '#ffffff',
        accent_color: settings.accent_color || '#059669',
        font_family: settings.font_family || 'Inter',
        custom_css: settings.custom_css || '',
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings(formData);
    toast.success('Branding settings saved successfully');
  };

  const handleReset = () => {
    setFormData({
      primary_color: '#000000',
      secondary_color: '#ffffff',
      accent_color: '#059669',
      font_family: 'Inter',
      custom_css: '',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Color Scheme</CardTitle>
          <CardDescription>
            Customize the colors used in the WiFi portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color (Header)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, primary_color: e.target.value }))
                  }
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, primary_color: e.target.value }))
                  }
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color (Text)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, secondary_color: e.target.value }))
                  }
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={formData.secondary_color}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, secondary_color: e.target.value }))
                  }
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent-color">Accent Color (Buttons)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="accent-color"
                  type="color"
                  value={formData.accent_color}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, accent_color: e.target.value }))
                  }
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={formData.accent_color}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, accent_color: e.target.value }))
                  }
                  placeholder="#059669"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>
            Choose the font family for the WiFi portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="font-family">Font Family</Label>
            <Select 
              value={formData.font_family} 
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, font_family: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter (Default)</SelectItem>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom CSS</CardTitle>
          <CardDescription>
            Add custom CSS to further customize the portal appearance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="custom-css">Custom CSS (Optional)</Label>
            <Textarea
              id="custom-css"
              value={formData.custom_css}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, custom_css: e.target.value }))
              }
              placeholder="/* Add your custom CSS here */&#10;.wifi-portal {&#10;  /* Your styles */&#10;}"
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Use CSS classes like .wifi-portal, .wifi-header, .wifi-form to target elements
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            Preview of your branding settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div 
              className="p-4 text-center font-semibold"
              style={{ 
                backgroundColor: formData.primary_color,
                color: formData.secondary_color,
                fontFamily: formData.font_family
              }}
            >
              The Nuthatch WiFi
            </div>
            <div className="p-6 bg-gray-50">
              <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6 space-y-4">
                <h2 style={{ fontFamily: formData.font_family }} className="text-lg font-semibold text-center">
                  Welcome! Connect to our free WiFi
                </h2>
                <button 
                  className="w-full py-2 px-4 rounded-md text-white font-medium"
                  style={{ backgroundColor: formData.accent_color, fontFamily: formData.font_family }}
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleReset}>
          Reset to Default
        </Button>
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? 'Saving...' : 'Save Branding'}
        </Button>
      </div>
    </div>
  );
};
