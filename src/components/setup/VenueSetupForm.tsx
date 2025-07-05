
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface VenueData {
  venueName: string;
  venueSlug: string;
  venueEmail: string;
  venuePhone: string;
  venueAddress: string;
}

interface VenueSetupFormProps {
  venueData: VenueData;
  onInputChange: (field: keyof VenueData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  loading: boolean;
}

export const VenueSetupForm: React.FC<VenueSetupFormProps> = ({
  venueData,
  onInputChange,
  onSubmit,
  onBack,
  loading
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> This information will be visible to your guests in booking confirmations and email communications.
        </p>
      </div>
      <div>
        <Label htmlFor="venueName">Venue Name</Label>
        <Input
          id="venueName"
          type="text"
          value={venueData.venueName}
          onChange={(e) => onInputChange('venueName', e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="venueSlug">URL Slug</Label>
        <Input
          id="venueSlug"
          type="text"
          value={venueData.venueSlug}
          onChange={(e) => onInputChange('venueSlug', e.target.value)}
          required
        />
        <p className="text-sm text-muted-foreground mt-1">
          This will be used for your email address: {venueData.venueSlug}@grace-os.co.uk
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="venueEmail">Contact Email</Label>
          <Input
            id="venueEmail"
            type="email"
            value={venueData.venueEmail}
            onChange={(e) => onInputChange('venueEmail', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="venuePhone">Phone Number</Label>
          <Input
            id="venuePhone"
            type="tel"
            value={venueData.venuePhone}
            onChange={(e) => onInputChange('venuePhone', e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="venueAddress">Address</Label>
        <Input
          id="venueAddress"
          type="text"
          value={venueData.venueAddress}
          onChange={(e) => onInputChange('venueAddress', e.target.value)}
        />
      </div>

      <div className="mt-4 p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Email Setup Preview</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Guest emails will be sent from:</strong> {venueData.venueName || 'Your Venue'} &lt;{venueData.venueSlug || 'your-venue'}@grace-os.co.uk&gt;</p>
          <p><strong>Platform emails will be sent from:</strong> Grace OS &lt;noreply@grace-os.co.uk&gt;</p>
          <p className="text-xs mt-2 opacity-75">Email delivery is automatically configured and managed by Grace OS.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Venue...
            </>
          ) : (
            'Complete Setup'
          )}
        </Button>
      </div>
    </form>
  );
};
