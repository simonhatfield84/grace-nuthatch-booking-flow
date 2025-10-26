import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, Save, Loader2, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVenueBranding } from "@/hooks/useVenueBranding";
import { MediaUpload } from "@/components/services/MediaUpload";
import { RichTextEditor } from "@/components/services/RichTextEditor";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (default)' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Karla', label: 'Karla' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Lato', label: 'Lato' }
];

const BUTTON_RADIUS_OPTIONS = [
  { value: 'sm', label: 'Small (4px)' },
  { value: 'md', label: 'Medium (6px)' },
  { value: 'lg', label: 'Large (8px)' },
  { value: 'full', label: 'Rounded (999px)' }
];

export function BrandingSettingsTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venueId, setVenueId] = useState<string>('');
  const [venueSlug, setVenueSlug] = useState<string>('');

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.venue_id) {
            setVenueId(data.venue_id);
            supabase
              .from('venues')
              .select('slug')
              .eq('id', data.venue_id)
              .single()
              .then(({ data: venueData }) => {
                if (venueData?.slug) setVenueSlug(venueData.slug);
              });
          }
        });
    }
  }, [user]);

  const { branding, widgetSettings, isLoading, updateBranding, updateWidgetSettings, isUpdating } = 
    useVenueBranding(venueId);

  const [localBranding, setLocalBranding] = useState({
    logo_url: '',
    primary_color: '#0ea5a0',
    secondary_color: '#111827',
    accent_color: '#f59e0b',
    font_heading: 'Inter',
    font_body: 'Inter',
    button_radius: 'md'
  });

  const [localWidget, setLocalWidget] = useState({
    hero_image_url: '',
    about_html: '',
    copy_json: {},
    flags_json: {}
  });

  useEffect(() => {
    if (branding) {
      setLocalBranding({
        logo_url: branding.logo_url || '',
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color,
        accent_color: branding.accent_color,
        font_heading: branding.font_heading,
        font_body: branding.font_body,
        button_radius: branding.button_radius
      });
    }
  }, [branding]);

  useEffect(() => {
    if (widgetSettings) {
      setLocalWidget({
        hero_image_url: widgetSettings.hero_image_url || '',
        about_html: widgetSettings.about_html || '',
        copy_json: widgetSettings.copy_json || {},
        flags_json: widgetSettings.flags_json || {}
      });
    }
  }, [widgetSettings]);

  const handleSaveBranding = () => {
    updateBranding(localBranding);
  };

  const handleSaveWidget = () => {
    updateWidgetSettings(localWidget);
  };

  const handlePreview = () => {
    if (venueSlug) {
      window.open(`/v4/booking/${venueSlug}/preview`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Brand & Widget</h2>
          <p className="text-muted-foreground">Customize your V4 booking widget appearance</p>
        </div>
        <Button onClick={handlePreview} variant="outline" disabled={!venueSlug}>
          <Eye className="h-4 w-4 mr-2" />
          Preview V4
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Changes here only affect the new V4 booking widget (/v4/booking/{venueSlug || 'your-slug'}).
          Your existing booking widget remains unchanged.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="visual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visual">Visual Identity</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
              <CardDescription>Define your brand colors (HEX format)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={localBranding.primary_color}
                      onChange={(e) => setLocalBranding({ ...localBranding, primary_color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={localBranding.primary_color}
                      onChange={(e) => setLocalBranding({ ...localBranding, primary_color: e.target.value })}
                      placeholder="#0ea5a0"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={localBranding.secondary_color}
                      onChange={(e) => setLocalBranding({ ...localBranding, secondary_color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={localBranding.secondary_color}
                      onChange={(e) => setLocalBranding({ ...localBranding, secondary_color: e.target.value })}
                      placeholder="#111827"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={localBranding.accent_color}
                      onChange={(e) => setLocalBranding({ ...localBranding, accent_color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={localBranding.accent_color}
                      onChange={(e) => setLocalBranding({ ...localBranding, accent_color: e.target.value })}
                      placeholder="#f59e0b"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Choose fonts for headings and body text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <Select
                    value={localBranding.font_heading}
                    onValueChange={(value) => setLocalBranding({ ...localBranding, font_heading: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(font => (
                        <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Body Font</Label>
                  <Select
                    value={localBranding.font_body}
                    onValueChange={(value) => setLocalBranding({ ...localBranding, font_body: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(font => (
                        <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buttons & Elements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Button Corner Radius</Label>
                <Select
                  value={localBranding.button_radius}
                  onValueChange={(value) => setLocalBranding({ ...localBranding, button_radius: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUTTON_RADIUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>Upload your venue logo (recommended: 400x100px PNG with transparency)</CardDescription>
            </CardHeader>
            <CardContent>
              <MediaUpload
                imageUrl={localBranding.logo_url}
                onImageChange={(url) => setLocalBranding({ ...localBranding, logo_url: url })}
                onRemove={() => setLocalBranding({ ...localBranding, logo_url: '' })}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveBranding} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Visual Identity
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaUpload
                imageUrl={localWidget.hero_image_url}
                onImageChange={(url) => setLocalWidget({ ...localWidget, hero_image_url: url })}
                onRemove={() => setLocalWidget({ ...localWidget, hero_image_url: '' })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About Section</CardTitle>
              <CardDescription>Describe your venue (supports basic formatting)</CardDescription>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                value={localWidget.about_html}
                onChange={(value) => setLocalWidget({ ...localWidget, about_html: value })}
                label="About Text"
                placeholder="Tell guests about your venue..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Copy & Labels</CardTitle>
              <CardDescription>Customize widget text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Hero Heading</Label>
                <Input
                  value={(localWidget.copy_json as any)?.heroHeading || ''}
                  onChange={(e) => setLocalWidget({
                    ...localWidget,
                    copy_json: { ...localWidget.copy_json, heroHeading: e.target.value }
                  })}
                  placeholder="Book Your Experience"
                />
              </div>
              <div className="space-y-2">
                <Label>Hero Subheading</Label>
                <Input
                  value={(localWidget.copy_json as any)?.heroSubheading || ''}
                  onChange={(e) => setLocalWidget({
                    ...localWidget,
                    copy_json: { ...localWidget.copy_json, heroSubheading: e.target.value }
                  })}
                  placeholder="Reserve your table in just a few clicks"
                />
              </div>
              <div className="space-y-2">
                <Label>Call-to-Action Button</Label>
                <Input
                  value={(localWidget.copy_json as any)?.ctaText || ''}
                  onChange={(e) => setLocalWidget({
                    ...localWidget,
                    copy_json: { ...localWidget.copy_json, ctaText: e.target.value }
                  })}
                  placeholder="Book Now"
                />
              </div>
              <div className="space-y-2">
                <Label>Deposit Explainer</Label>
                <Input
                  value={(localWidget.copy_json as any)?.depositExplainer || ''}
                  onChange={(e) => setLocalWidget({
                    ...localWidget,
                    copy_json: { ...localWidget.copy_json, depositExplainer: e.target.value }
                  })}
                  placeholder="A small deposit secures your booking..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveWidget} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Content
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Widget Features</CardTitle>
              <CardDescription>Toggle sections on/off</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showHero"
                  checked={(localWidget.flags_json as any)?.showHero ?? true}
                  onCheckedChange={(checked) => setLocalWidget({
                    ...localWidget,
                    flags_json: { ...localWidget.flags_json, showHero: checked }
                  })}
                />
                <Label htmlFor="showHero">Show Hero Section</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showAbout"
                  checked={(localWidget.flags_json as any)?.showAbout ?? true}
                  onCheckedChange={(checked) => setLocalWidget({
                    ...localWidget,
                    flags_json: { ...localWidget.flags_json, showAbout: checked }
                  })}
                />
                <Label htmlFor="showAbout">Show About Section</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showDepositExplainer"
                  checked={(localWidget.flags_json as any)?.showDepositExplainer ?? true}
                  onCheckedChange={(checked) => setLocalWidget({
                    ...localWidget,
                    flags_json: { ...localWidget.flags_json, showDepositExplainer: checked }
                  })}
                />
                <Label htmlFor="showDepositExplainer">Show Deposit Explainer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showAllergyNote"
                  checked={(localWidget.flags_json as any)?.showAllergyNote ?? true}
                  onCheckedChange={(checked) => setLocalWidget({
                    ...localWidget,
                    flags_json: { ...localWidget.flags_json, showAllergyNote: checked }
                  })}
                />
                <Label htmlFor="showAllergyNote">Show Allergy Note</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveWidget} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Features
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
