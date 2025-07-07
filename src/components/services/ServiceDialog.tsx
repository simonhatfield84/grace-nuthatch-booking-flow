import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useServices } from "@/hooks/useServices";
import { useTags } from "@/hooks/useTags";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DurationRules } from "@/components/services/DurationRules";
import { MediaUpload } from "@/components/services/MediaUpload";

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingService?: any;
  newService: any;
  setEditingService: (service: any) => void;
  setNewService: (service: any) => void;
  onAddService: (serviceData?: any) => Promise<boolean>;
  onUpdateService: (serviceData?: any) => Promise<boolean>;
  createServiceMutation: any;
  updateServiceMutation: any;
  onReset: () => void;
}

const ServiceDialog = ({ 
  open, 
  onOpenChange, 
  editingService, 
  newService, 
  setEditingService, 
  setNewService, 
  onAddService, 
  onUpdateService, 
  createServiceMutation, 
  updateServiceMutation, 
  onReset 
}: ServiceDialogProps) => {
  const { toast } = useToast();
  const { tags, isLoading: isTagsLoading } = useTags();

  const [title, setTitle] = useState(editingService?.title || newService?.title || '');
  const [description, setDescription] = useState(editingService?.description || newService?.description || '');
  const [minGuests, setMinGuests] = useState(editingService?.min_guests || newService?.min_guests || 1);
  const [maxGuests, setMaxGuests] = useState(editingService?.max_guests || newService?.max_guests || 10);
  const [leadTimeHours, setLeadTimeHours] = useState(editingService?.lead_time_hours || newService?.lead_time_hours || 24);
  const [cancellationWindowHours, setCancellationWindowHours] = useState(editingService?.cancellation_window_hours || newService?.cancellation_window_hours || 24);
  const [requiresDeposit, setRequiresDeposit] = useState(editingService?.requires_deposit || newService?.requires_deposit || false);
  const [depositPerGuest, setDepositPerGuest] = useState(editingService?.deposit_per_guest || newService?.deposit_per_guest || 0);
  const [onlineBookable, setOnlineBookable] = useState(editingService?.online_bookable ?? newService?.online_bookable ?? true);
  const [active, setActive] = useState(editingService?.active ?? newService?.active ?? true);
  const [isSecret, setIsSecret] = useState(editingService?.is_secret || newService?.is_secret || false);
  const [secretSlug, setSecretSlug] = useState(editingService?.secret_slug || newService?.secret_slug || '');
  const [imageUrl, setImageUrl] = useState(editingService?.image_url || newService?.image_url || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(editingService?.tag_ids || newService?.tag_ids || []);
  const [durationRules, setDurationRules] = useState(editingService?.duration_rules || newService?.duration_rules || []);
  const [termsAndConditions, setTermsAndConditions] = useState(editingService?.terms_and_conditions || newService?.terms_and_conditions || '');

  // Payment-related form state
  const [paymentSettings, setPaymentSettings] = useState({
    requires_payment: editingService?.requires_payment || newService?.requires_payment || false,
    charge_type: editingService?.charge_type || newService?.charge_type || 'all_reservations',
    minimum_guests_for_charge: editingService?.minimum_guests_for_charge || newService?.minimum_guests_for_charge || 8,
    charge_amount_per_guest: editingService?.charge_amount_per_guest || newService?.charge_amount_per_guest || 0,
  });

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prevSelected) =>
      prevSelected.includes(tagId)
        ? prevSelected.filter((id) => id !== tagId)
        : [...prevSelected, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Service title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const serviceData = {
        id: editingService?.id,
        title: title.trim(),
        description: description.trim() || null,
        min_guests: minGuests,
        max_guests: maxGuests,
        lead_time_hours: leadTimeHours,
        cancellation_window_hours: cancellationWindowHours,
        requires_deposit: requiresDeposit,
        deposit_per_guest: requiresDeposit ? depositPerGuest : 0,
        online_bookable: onlineBookable,
        active,
        is_secret: isSecret,
        secret_slug: isSecret ? secretSlug : null,
        image_url: imageUrl,
        tag_ids: selectedTags,
        duration_rules: durationRules,
        terms_and_conditions: termsAndConditions,
        // Payment settings logic
        requires_payment: paymentSettings.requires_payment,
        charge_type: paymentSettings.requires_payment ? paymentSettings.charge_type : 'none',
        minimum_guests_for_charge: paymentSettings.minimum_guests_for_charge,
        charge_amount_per_guest: paymentSettings.charge_amount_per_guest,
      };

      // Pass serviceData directly to the functions
      if (editingService) {
        const success = await onUpdateService(serviceData);
        if (success) {
          onOpenChange(false);
          onReset();
        }
      } else {
        const success = await onAddService(serviceData);
        if (success) {
          onOpenChange(false);
          onReset();
        }
      }
    } catch (error) {
      console.error('Service save error:', error);
    }
  };

  useEffect(() => {
    const service = editingService || newService;
    if (service) {
      setTitle(service.title || '');
      setDescription(service.description || '');
      setMinGuests(service.min_guests || 1);
      setMaxGuests(service.max_guests || 10);
      setLeadTimeHours(service.lead_time_hours || 24);
      setCancellationWindowHours(service.cancellation_window_hours || 24);
      setRequiresDeposit(service.requires_deposit || false);
      setDepositPerGuest(service.deposit_per_guest || 0);
      setOnlineBookable(service.online_bookable ?? true);
      setActive(service.active ?? true);
      setIsSecret(service.is_secret || false);
      setSecretSlug(service.secret_slug || '');
      setImageUrl(service.image_url || '');
      setSelectedTags(service.tag_ids || []);
      setDurationRules(service.duration_rules || []);
      setTermsAndConditions(service.terms_and_conditions || '');
      
      // Initialize payment settings properly
      setPaymentSettings({
        requires_payment: service.requires_payment || false,
        charge_type: service.charge_type || 'all_reservations',
        minimum_guests_for_charge: service.minimum_guests_for_charge || 8,
        charge_amount_per_guest: service.charge_amount_per_guest || 0,
      });
    }
  }, [editingService, newService]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Create New Service'}</DialogTitle>
            <DialogDescription>
              Configure your service settings and availability
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="booking">Booking</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Service Title</Label>
                  <Input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="booking" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minGuests">Minimum Guests</Label>
                  <Input
                    type="number"
                    id="minGuests"
                    value={minGuests}
                    onChange={(e) => setMinGuests(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxGuests">Maximum Guests</Label>
                  <Input
                    type="number"
                    id="maxGuests"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leadTimeHours">Lead Time (Hours)</Label>
                  <Input
                    type="number"
                    id="leadTimeHours"
                    value={leadTimeHours}
                    onChange={(e) => setLeadTimeHours(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cancellationWindowHours">Cancellation Window (Hours)</Label>
                  <Input
                    type="number"
                    id="cancellationWindowHours"
                    value={cancellationWindowHours}
                    onChange={(e) => setCancellationWindowHours(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresDeposit"
                  checked={requiresDeposit}
                  onCheckedChange={(checked) => setRequiresDeposit(checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="requiresDeposit">Requires Deposit</Label>
                  <p className="text-sm text-muted-foreground">
                    Require a deposit to secure the booking
                  </p>
                </div>
              </div>

              {requiresDeposit && (
                <div className="space-y-2">
                  <Label htmlFor="depositPerGuest">Deposit Per Guest</Label>
                  <Input
                    type="number"
                    id="depositPerGuest"
                    value={depositPerGuest}
                    onChange={(e) => setDepositPerGuest(parseInt(e.target.value))}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="onlineBookable"
                  checked={onlineBookable}
                  onCheckedChange={(checked) => setOnlineBookable(checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="onlineBookable">Online Bookable</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to book this service online
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duration Rules</Label>
                <DurationRules
                  rules={durationRules}
                  onChange={setDurationRules}
                />
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Payment</Label>
                    <p className="text-sm text-muted-foreground">
                      Charge customers when they book this service
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.requires_payment}
                    onCheckedChange={(checked) =>
                      setPaymentSettings(prev => ({ ...prev, requires_payment: checked }))
                    }
                  />
                </div>

                {/* Only show payment options when payment is required */}
                {paymentSettings.requires_payment && (
                  <>
                    <div className="space-y-2">
                      <Label>Payment Rule</Label>
                      <Select
                        value={paymentSettings.charge_type}
                        onValueChange={(value: 'all_reservations' | 'large_groups') =>
                          setPaymentSettings(prev => ({ ...prev, charge_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_reservations">All reservations</SelectItem>
                          <SelectItem value="large_groups">Large groups only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentSettings.charge_type === 'large_groups' && (
                      <div className="space-y-2">
                        <Label>Minimum Guests for Charge</Label>
                        <Input
                          type="number"
                          min="1"
                          value={paymentSettings.minimum_guests_for_charge}
                          onChange={(e) =>
                            setPaymentSettings(prev => ({
                              ...prev,
                              minimum_guests_for_charge: parseInt(e.target.value) || 8
                            }))
                          }
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Charge Amount per Guest</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paymentSettings.charge_amount_per_guest / 100}
                          onChange={(e) =>
                            setPaymentSettings(prev => ({
                              ...prev,
                              charge_amount_per_guest: Math.round(parseFloat(e.target.value || '0') * 100)
                            }))
                          }
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
              <MediaUpload
                imageUrl={imageUrl}
                onImageChange={setImageUrl}
                onRemove={() => setImageUrl('')}
              />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={active}
                  onCheckedChange={(checked) => setActive(checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="active">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Service is available for booking
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isSecret"
                  checked={isSecret}
                  onCheckedChange={(checked) => setIsSecret(checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="isSecret">Secret Service</Label>
                  <p className="text-sm text-muted-foreground">
                    Only accessible via a secret link
                  </p>
                </div>
              </div>

              {isSecret && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="secretSlug">Secret Slug</Label>
                    <Input
                      type="text"
                      id="secretSlug"
                      value={secretSlug}
                      onChange={(e) => setSecretSlug(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {isTagsLoading ? (
                    <div>Loading tags...</div>
                  ) : (
                    tags.map((tag) => (
                      <Button
                        key={tag.id}
                        type="button"
                        variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                        onClick={() => handleTagToggle(tag.id)}
                      >
                        {tag.name}
                      </Button>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
                  <Textarea
                    id="termsAndConditions"
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
            >
              {createServiceMutation.isPending || updateServiceMutation.isPending ? 'Saving...' : 'Save Service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDialog;
