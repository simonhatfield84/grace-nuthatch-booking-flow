
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/services/RichTextEditor";
import { useWifiSettings } from "@/hooks/useWifiSettings";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface WifiTermsEditorProps {
  settings: any;
  venueId?: string;
}

export const WifiTermsEditor = ({ settings, venueId }: WifiTermsEditorProps) => {
  const { updateSettings, isUpdating } = useWifiSettings(venueId);
  const [termsContent, setTermsContent] = useState('');

  useEffect(() => {
    if (settings?.terms_content) {
      setTermsContent(settings.terms_content);
    } else {
      // Set default terms
      setTermsContent(`
        <h3>WiFi Terms of Use</h3>
        <p>By accessing our WiFi network, you agree to the following terms:</p>
        <ul>
          <li>Use the network responsibly and in accordance with applicable laws</li>
          <li>Do not engage in any illegal or inappropriate activities</li>
          <li>Respect the network resources and other users</li>
          <li>We collect basic device information for network security and analytics</li>
        </ul>
        <p>These terms may be updated from time to time. Continued use of the network constitutes acceptance of any changes.</p>
      `);
    }
  }, [settings]);

  const handleSave = () => {
    const currentVersion = settings?.terms_version || 1;
    updateSettings({ 
      terms_content: termsContent,
      terms_version: currentVersion + 1
    });
    toast.success('Terms & Conditions updated successfully');
  };

  const handleReset = () => {
    const defaultTerms = `
      <h3>WiFi Terms of Use</h3>
      <p>By accessing our WiFi network, you agree to the following terms:</p>
      <ul>
        <li>Use the network responsibly and in accordance with applicable laws</li>
        <li>Do not engage in any illegal or inappropriate activities</li>
        <li>Respect the network resources and other users</li>
        <li>We collect basic device information for network security and analytics</li>
      </ul>
      <p>These terms may be updated from time to time. Continued use of the network constitutes acceptance of any changes.</p>
    `;
    setTermsContent(defaultTerms);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Terms & Conditions</CardTitle>
              <CardDescription>
                Customize the terms and conditions shown to guests
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Version {settings?.terms_version || 1}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <RichTextEditor
            value={termsContent}
            onChange={setTermsContent}
            placeholder="Enter your terms and conditions..."
          />
          
          <div className="flex items-center justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={handleReset}
              type="button"
            >
              Reset to Default
            </Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Terms'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            How your terms will appear to guests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-sm max-w-none p-4 border rounded-md bg-muted/50"
            dangerouslySetInnerHTML={{ __html: termsContent }}
          />
        </CardContent>
      </Card>
    </div>
  );
};
