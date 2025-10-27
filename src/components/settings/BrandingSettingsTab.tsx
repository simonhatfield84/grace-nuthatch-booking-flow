import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, Loader2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useVenueBranding } from "@/hooks/useVenueBranding";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GOOGLE_FONTS } from "@/constants/fonts";
import { ContrastChecker } from "@/components/branding/ContrastChecker";
import { MediaManager } from "@/components/branding/MediaManager";
import { LogoUploadDual } from "@/components/branding/LogoUploadDual";

export function BrandingSettingsTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venueId, setVenueId] = useState<string>('');
  const [venueSlug, setVenueSlug] = useState<string>('');
  const [activeTab, setActiveTab] = useState('visual');
  const [isDirty, setIsDirty] = useState(false);
  const [originalBranding, setOriginalBranding] = useState<any>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

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

  const { branding, media, isLoading, isMediaLoading, updateBranding, isUpdating, refetchMedia } = 
    useVenueBranding(venueId);

  const [localBranding, setLocalBranding] = useState({
    logo_light: null as string | null,
    logo_dark: null as string | null,
    primary_color: '#0ea5a0',
    secondary_color: '#111827',
    accent_color: '#f59e0b',
    font_heading: 'Inter',
    font_body: 'Inter',
    button_shape: 'rounded' as 'rounded' | 'square'
  });

  useEffect(() => {
    if (branding) {
      const brandingData = {
        logo_light: branding.logo_light,
        logo_dark: branding.logo_dark,
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color,
        accent_color: branding.accent_color,
        font_heading: branding.font_heading,
        font_body: branding.font_body,
        button_shape: branding.button_shape
      };
      setLocalBranding(brandingData);
      setOriginalBranding(brandingData);
    }
  }, [branding]);

  // Track changes to enable dirty state
  useEffect(() => {
    if (originalBranding) {
      const hasChanges = JSON.stringify(localBranding) !== JSON.stringify(originalBranding);
      setIsDirty(hasChanges);
    }
  }, [localBranding, originalBranding]);

  const handleSaveBranding = () => {
    if (!originalBranding) return;
    
    // Only send changed fields
    const changes: any = {};
    Object.keys(localBranding).forEach((key) => {
      if (localBranding[key as keyof typeof localBranding] !== originalBranding[key]) {
        changes[key] = localBranding[key as keyof typeof localBranding];
      }
    });
    
    updateBranding(changes);
    setIsDirty(false);
  };

  // Lazy load media when Media tab is clicked
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'media') {
      refetchMedia();
    }
  };

  // Load fonts on first Select open
  const handleFontSelectOpen = () => {
    if (!fontsLoaded) {
      const loadFont = (fontName: string) => {
        if (!document.querySelector(`link[href*="${fontName.replace(' ', '+')}"]`)) {
          const link = document.createElement('link');
          link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@400;500;600;700&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      };
      loadFont(localBranding.font_heading);
      loadFont(localBranding.font_body);
      setFontsLoaded(true);
    }
  };

  const handleLogoUpdate = (variant: 'light' | 'dark', url: string | null) => {
    if (variant === 'light') {
      setLocalBranding({ ...localBranding, logo_light: url });
    } else {
      setLocalBranding({ ...localBranding, logo_dark: url });
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
          <h2 className="text-2xl font-bold">Venue Branding</h2>
          <p className="text-muted-foreground">Customize your venue's visual identity globally</p>
        </div>
        {isDirty && (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
            Unsaved changes
          </Badge>
        )}
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These settings apply to your public booking widget and all customer-facing pages.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visual">Visual Identity</TabsTrigger>
          <TabsTrigger value="media">
            Media
            {isMediaLoading && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-6">
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Logo Guidelines:</strong> Upload both light and dark versions for optimal visibility. 
              Light logos display on dark backgrounds (e.g., header), dark logos on light backgrounds.
            </AlertDescription>
          </Alert>
          
          {/* Logos */}
          <Card>
            <CardHeader>
              <CardTitle>Logos</CardTitle>
              <CardDescription>Upload light and dark variants for different backgrounds</CardDescription>
            </CardHeader>
            <CardContent>
              <LogoUploadDual
                venueId={venueId}
                logoLight={localBranding.logo_light}
                logoDark={localBranding.logo_dark}
                onUpdate={handleLogoUpdate}
              />
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Define your venue's color palette (HEX format)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              {/* Contrast Checkers */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">WCAG Contrast Validation</h4>
                <ContrastChecker
                  foreground="#FFFFFF"
                  background={localBranding.primary_color}
                  label="White text on primary"
                />
                <ContrastChecker
                  foreground="#000000"
                  background={localBranding.accent_color}
                  label="Black text on accent"
                />
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Select fonts from Google Fonts library</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="font-heading">Heading Font</Label>
                  <Select
                    value={localBranding.font_heading}
                    onValueChange={(value) => setLocalBranding({ ...localBranding, font_heading: value })}
                    onOpenChange={(open) => open && handleFontSelectOpen()}
                  >
                    <SelectTrigger id="font-heading">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOOGLE_FONTS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: localBranding.font_heading }}>
                    Preview: The Quick Brown Fox Jumps
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-body">Body Font</Label>
                  <Select
                    value={localBranding.font_body}
                    onValueChange={(value) => setLocalBranding({ ...localBranding, font_body: value })}
                    onOpenChange={(open) => open && handleFontSelectOpen()}
                  >
                    <SelectTrigger id="font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOOGLE_FONTS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: localBranding.font_body }}>
                    Preview: The quick brown fox jumps over the lazy dog
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Button Style */}
          <Card>
            <CardHeader>
              <CardTitle>Button Shape</CardTitle>
              <CardDescription>Choose the corner style for buttons</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={localBranding.button_shape}
                onValueChange={(value: 'rounded' | 'square') => setLocalBranding({ ...localBranding, button_shape: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rounded" id="rounded" />
                  <Label htmlFor="rounded" className="flex items-center gap-2 cursor-pointer">
                    Rounded
                    <Button variant="default" size="sm" className="rounded-full pointer-events-none">
                      Preview
                    </Button>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="square" id="square" />
                  <Label htmlFor="square" className="flex items-center gap-2 cursor-pointer">
                    Square
                    <Button variant="default" size="sm" className="rounded-sm pointer-events-none">
                      Preview
                    </Button>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            {isDirty && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setLocalBranding(originalBranding);
                  setIsDirty(false);
                }}
              >
                Discard Changes
              </Button>
            )}
            <Button onClick={handleSaveBranding} disabled={isUpdating || !isDirty}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Visual Identity
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          {/* Hero Images */}
          <Card>
            <CardHeader>
              <CardTitle>Hero Images</CardTitle>
              <CardDescription>Large featured images for your booking widget header</CardDescription>
            </CardHeader>
            <CardContent>
              <MediaManager venueId={venueId} type="hero" label="Hero Images" />
            </CardContent>
          </Card>

          {/* About Images */}
          <Card>
            <CardHeader>
              <CardTitle>About Gallery</CardTitle>
              <CardDescription>Images showcasing your venue and atmosphere</CardDescription>
            </CardHeader>
            <CardContent>
              <MediaManager venueId={venueId} type="about" label="About Images" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
