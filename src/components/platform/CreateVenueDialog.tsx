
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface VenueFormData {
  venueName: string;
  venueSlug: string;
  venueEmail: string;
  venuePhone: string;
  venueAddress: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
}

export function CreateVenueDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<VenueFormData>({
    venueName: '',
    venueSlug: '',
    venueEmail: '',
    venuePhone: '',
    venueAddress: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
  });

  const queryClient = useQueryClient();

  const createVenueMutation = useMutation({
    mutationFn: async (data: VenueFormData) => {
      console.log('Creating venue with data:', data);
      
      // First create the user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.adminEmail,
        password: 'TempPassword123!', // Generate a temporary password
        email_confirm: true,
        user_metadata: {
          first_name: data.adminFirstName,
          last_name: data.adminLastName,
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      console.log('User created:', authData.user.id);

      // Use the database function to create venue and profile atomically
      const { data: venueResult, error: venueError } = await supabase.rpc('setup_venue_atomic', {
        p_user_id: authData.user.id,
        p_email: data.adminEmail,
        p_first_name: data.adminFirstName,
        p_last_name: data.adminLastName,
        p_venue_name: data.venueName,
        p_venue_slug: data.venueSlug,
        p_venue_email: data.venueEmail,
        p_venue_phone: data.venuePhone,
        p_venue_address: data.venueAddress,
      });

      if (venueError) {
        console.error('Venue creation error:', venueError);
        throw new Error(`Failed to create venue: ${venueError.message}`);
      }

      if (!venueResult?.success) {
        throw new Error(venueResult?.error || 'Failed to create venue');
      }

      return venueResult;
    },
    onSuccess: (data) => {
      console.log('Venue created successfully:', data);
      toast.success(`Venue "${formData.venueName}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['platform-venues'] });
      setOpen(false);
      setFormData({
        venueName: '',
        venueSlug: '',
        venueEmail: '',
        venuePhone: '',
        venueAddress: '',
        adminFirstName: '',
        adminLastName: '',
        adminEmail: '',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to create venue:', error);
      toast.error(`Failed to create venue: ${error.message}`);
    },
  });

  const handleInputChange = (field: keyof VenueFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from venue name
    if (field === 'venueName' && value) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({
        ...prev,
        venueSlug: slug
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const requiredFields: (keyof VenueFormData)[] = [
      'venueName', 'venueSlug', 'venueEmail', 'adminFirstName', 'adminLastName', 'adminEmail'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.adminEmail.includes('@')) {
      toast.error('Please enter a valid admin email address');
      return;
    }

    createVenueMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Create New Venue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Venue</DialogTitle>
          <DialogDescription>
            Create a new venue and set up the admin user account. The admin will receive login details via email.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Venue Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Venue Information</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="venueName">Venue Name *</Label>
                <Input
                  id="venueName"
                  value={formData.venueName}
                  onChange={(e) => handleInputChange('venueName', e.target.value)}
                  placeholder="Restaurant Name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="venueSlug">URL Slug *</Label>
                <Input
                  id="venueSlug"
                  value={formData.venueSlug}
                  onChange={(e) => handleInputChange('venueSlug', e.target.value)}
                  placeholder="restaurant-name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="venueEmail">Venue Email *</Label>
                <Input
                  id="venueEmail"
                  type="email"
                  value={formData.venueEmail}
                  onChange={(e) => handleInputChange('venueEmail', e.target.value)}
                  placeholder="info@restaurant.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="venuePhone">Venue Phone</Label>
                <Input
                  id="venuePhone"
                  value={formData.venuePhone}
                  onChange={(e) => handleInputChange('venuePhone', e.target.value)}
                  placeholder="+44 20 1234 5678"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="venueAddress">Address</Label>
              <Textarea
                id="venueAddress"
                value={formData.venueAddress}
                onChange={(e) => handleInputChange('venueAddress', e.target.value)}
                placeholder="123 Restaurant Street, London, UK"
                rows={2}
              />
            </div>
          </div>

          {/* Admin User Details */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-900">Admin User Account</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adminFirstName">First Name *</Label>
                <Input
                  id="adminFirstName"
                  value={formData.adminFirstName}
                  onChange={(e) => handleInputChange('adminFirstName', e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <Label htmlFor="adminLastName">Last Name *</Label>
                <Input
                  id="adminLastName"
                  value={formData.adminLastName}
                  onChange={(e) => handleInputChange('adminLastName', e.target.value)}
                  placeholder="Smith"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="adminEmail">Admin Email *</Label>
              <Input
                id="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                placeholder="admin@restaurant.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This person will be the venue owner and receive login instructions.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createVenueMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createVenueMutation.isPending ? 'Creating...' : 'Create Venue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
