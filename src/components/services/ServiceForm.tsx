
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useCreateService, useUpdateService } from "@/hooks/useServices";
import { useServiceTags } from "@/hooks/useServiceTags";
import { useToast } from "@/hooks/use-toast";

interface ServiceFormProps {
  service?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ServiceForm = ({ service, onSuccess, onCancel }: ServiceFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    min_guests: 1,
    max_guests: 8,
    duration_minutes: 120,
    lead_time_hours: 2,
    cancellation_window_hours: 24,
    online_bookable: true,
    active: true,
    is_secret: false,
    secret_slug: '',
    terms_and_conditions: '',
    image_url: '',
    tag_ids: [] as string[]
  });

  const { toast } = useToast();
  const { data: tags = [] } = useServiceTags();
  const createService = useCreateService();
  const updateService = useUpdateService();

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title || '',
        description: service.description || '',
        min_guests: service.min_guests || 1,
        max_guests: service.max_guests || 8,
        duration_minutes: service.duration_minutes || 120,
        lead_time_hours: service.lead_time_hours || 2,
        cancellation_window_hours: service.cancellation_window_hours || 24,
        online_bookable: service.online_bookable ?? true,
        active: service.active ?? true,
        is_secret: service.is_secret || false,
        secret_slug: service.secret_slug || '',
        terms_and_conditions: service.terms_and_conditions || '',
        image_url: service.image_url || '',
        tag_ids: service.tag_ids || []
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const serviceData = {
        ...formData,
        duration_rules: [],
        requires_deposit: false,
        deposit_per_guest: 0
      };

      if (service) {
        await updateService.mutateAsync({ id: service.id, ...serviceData });
        toast({
          title: "Service updated",
          description: "Your service has been updated successfully.",
        });
      } else {
        await createService.mutateAsync(serviceData);
        toast({
          title: "Service created",
          description: "Your service has been created successfully.",
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error('Service save error:', error);
      toast({
        title: "Error",
        description: "Failed to save service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId]
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Details</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Service Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
                <Textarea
                  id="terms_and_conditions"
                  value={formData.terms_and_conditions}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms_and_conditions: e.target.value }))}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_guests">Minimum Guests</Label>
                  <Input
                    id="min_guests"
                    type="number"
                    min="1"
                    value={formData.min_guests}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_guests: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="max_guests">Maximum Guests</Label>
                  <Input
                    id="max_guests"
                    type="number"
                    min="1"
                    value={formData.max_guests}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_guests: parseInt(e.target.value) || 8 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lead_time_hours">Lead Time (hours)</Label>
                  <Input
                    id="lead_time_hours"
                    type="number"
                    min="0"
                    value={formData.lead_time_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, lead_time_hours: parseInt(e.target.value) || 2 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cancellation_window_hours">Cancellation Window (hours)</Label>
                  <Input
                    id="cancellation_window_hours"
                    type="number"
                    min="0"
                    value={formData.cancellation_window_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, cancellation_window_hours: parseInt(e.target.value) || 24 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min="30"
                  step="30"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 120 }))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Online Bookable</Label>
                    <p className="text-sm text-muted-foreground">Allow guests to book this service online</p>
                  </div>
                  <Switch
                    checked={formData.online_bookable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, online_bookable: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active</Label>
                    <p className="text-sm text-muted-foreground">Make this service available for booking</p>
                  </div>
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Secret Service</Label>
                    <p className="text-sm text-muted-foreground">Only accessible via direct link</p>
                  </div>
                  <Switch
                    checked={formData.is_secret}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_secret: checked }))}
                  />
                </div>

                {formData.is_secret && (
                  <div>
                    <Label htmlFor="secret_slug">Secret URL Slug</Label>
                    <Input
                      id="secret_slug"
                      value={formData.secret_slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, secret_slug: e.target.value }))}
                      placeholder="secret-url-slug"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={formData.tag_ids.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {tag.name}
                    {formData.tag_ids.includes(tag.id) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createService.isPending || updateService.isPending}
        >
          {service ? 'Update Service' : 'Create Service'}
        </Button>
      </div>
    </form>
  );
};
