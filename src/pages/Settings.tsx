
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/services/RichTextEditor";
import { TagManagement } from "@/components/settings/TagManagement";
import { VenueHoursSettings } from "@/components/settings/VenueHoursSettings";

const Settings = () => {
  const { toast } = useToast();
  const [standardTerms, setStandardTerms] = useState(`**Standard Terms & Conditions**

1. **Booking Confirmation**
   - All bookings are subject to availability
   - Confirmation will be sent within 24 hours

2. **Cancellation Policy**
   - Cancellations must be made within the specified notice period
   - Late cancellations may incur charges

3. **Deposit Requirements**
   - Deposits are required for certain services
   - Deposits are non-refundable for no-shows

4. **Group Size Changes**
   - Changes to party size must be communicated in advance
   - Additional charges may apply for increased party size

5. **Special Requirements**
   - Please inform us of any dietary restrictions or special requirements
   - We will do our best to accommodate all requests

_By making a booking, you agree to these terms and conditions._`);

  const handleSaveSettings = () => {
    // In a real app, this would save to the database
    localStorage.setItem('standardTerms', standardTerms);
    toast({
      title: "Settings saved",
      description: "Your standard terms & conditions have been updated.",
    });
  };

  const handleLoadStandardTerms = () => {
    const saved = localStorage.getItem('standardTerms');
    if (saved) {
      setStandardTerms(saved);
    }
  };

  // Load saved terms on component mount
  useState(() => {
    const saved = localStorage.getItem('standardTerms');
    if (saved) {
      setStandardTerms(saved);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your restaurant settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Venue Hours Settings */}
        <VenueHoursSettings />

        {/* Tag Management */}
        <TagManagement />

        {/* Standard Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Standard Terms & Conditions</CardTitle>
            <CardDescription>
              Set default terms and conditions that can be used across all services.
              Individual services can either use these standard terms or define their own custom terms.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RichTextEditor
              value={standardTerms}
              onChange={setStandardTerms}
              label="Standard Terms & Conditions"
              placeholder="Enter your standard terms and conditions here..."
              minHeight="min-h-[300px]"
            />
            
            <div className="flex gap-2">
              <Button onClick={handleSaveSettings}>
                Save Standard Terms
              </Button>
              <Button variant="outline" onClick={handleLoadStandardTerms}>
                Reload Saved Terms
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Settings Sections for Future */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              General restaurant settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Additional settings will be added here in future updates.
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default Settings;
