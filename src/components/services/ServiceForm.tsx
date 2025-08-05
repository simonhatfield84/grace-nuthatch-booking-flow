import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CreditCard, RefreshCw } from "lucide-react";
import { ServiceFormData } from '@/hooks/useServicesData';
import { DurationRules, DurationRule } from './DurationRules';
import { MediaUpload } from './MediaUpload';
import { InlineBookingWindowManager } from './InlineBookingWindowManager';

interface ServiceFormProps {
  formData: ServiceFormData;
  onFormDataChange: (updates: Partial<ServiceFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditing
}) => {
  // Local state for display amount (in pounds as string)
  const [displayAmount, setDisplayAmount] = useState<string>('');

  // Update display amount when formData changes (e.g., when editing existing service)
  useEffect(() => {
    if (formData.charge_amount_per_guest === 0) {
      setDisplayAmount('');
    } else {
      setDisplayAmount((formData.charge_amount_per_guest / 100).toFixed(2));
    }
  }, [formData.charge_amount_per_guest]);

  const handleDurationRulesChange = (rules: DurationRule[]) => {
    onFormDataChange({ duration_rules: rules });
  };

  const handleImageChange = (url: string) => {
    onFormDataChange({ image_url: url });
  };

  const handleImageRemove = () => {
    onFormDataChange({ image_url: '' });
  };

  // Handle payment amount change
  const handlePaymentAmountChange = (value: string) => {
    setDisplayAmount(value);
    
    // Convert to pence and update form data immediately
    const poundValue = parseFloat(value) || 0;
    const penceValue = Math.round(poundValue * 100);
    onFormDataChange({ charge_amount_per_guest: penceValue });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  // Get the service ID for booking windows - only available when editing
  const serviceIdForBookingWindows = isEditing ? (formData as any).id : null;

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="payments">Payments & Refunds</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label htmlFor="title">Service Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => onFormDataChange({ title: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormDataChange({ description: e.target.value })}
              rows={4}
            />
          </div>

          <MediaUpload
            imageUrl={formData.image_url}
            onImageChange={handleImageChange}
            onRemove={handleImageRemove}
          />
        </TabsContent>

        <TabsContent value="booking" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_guests">Minimum Guests</Label>
              <Input
                id="min_guests"
                type="number"
                min="1"
                value={formData.min_guests}
                onChange={(e) => onFormDataChange({ min_guests: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label htmlFor="max_guests">Maximum Guests</Label>
              <Input
                id="max_guests"
                type="number"
                min="1"
                value={formData.max_guests}
                onChange={(e) => onFormDataChange({ max_guests: parseInt(e.target.value) || 8 })}
              />
            </div>
          </div>

          <div>
            <Label>Duration Rules</Label>
            <DurationRules
              rules={formData.duration_rules || []}
              onChange={handleDurationRulesChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lead_time_hours">Lead Time (Hours)</Label>
              <Input
                id="lead_time_hours"
                type="number"
                min="0"
                value={formData.lead_time_hours}
                onChange={(e) => onFormDataChange({ lead_time_hours: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="cancellation_window_hours">Cancellation Window (Hours)</Label>
              <Input
                id="cancellation_window_hours"
                type="number"
                min="0"
                value={formData.cancellation_window_hours}
                onChange={(e) => onFormDataChange({ cancellation_window_hours: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Online Bookable</Label>
              <p className="text-sm text-muted-foreground">Allow customers to book online</p>
            </div>
            <Switch
              checked={formData.online_bookable}
              onCheckedChange={(checked) => onFormDataChange({ online_bookable: checked })}
            />
          </div>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Booking Availability</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure when this service is available for booking by setting up booking windows with specific days, times, and capacity limits.
              </p>
            </div>
            
            {serviceIdForBookingWindows ? (
              <InlineBookingWindowManager serviceId={serviceIdForBookingWindows} />
            ) : (
              <div className="border rounded-lg p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Save the service first to configure booking availability windows.
                </p>
                <p className="text-sm text-muted-foreground">
                  You'll be able to set specific days, times, and booking limits after creating the service.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {/* Payment Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Payment Settings</h3>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Require Payment</Label>
                <p className="text-sm text-muted-foreground">Charge customers when they book</p>
              </div>
              <Switch
                checked={formData.requires_payment}
                onCheckedChange={(checked) => {
                  onFormDataChange({ 
                    requires_payment: checked,
                    charge_type: checked ? 'all_reservations' : 'none'
                  });
                }}
              />
            </div>

            {formData.requires_payment && (
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <div>
                  <Label>Payment Rule</Label>
                  <Select
                    value={formData.charge_type}
                    onValueChange={(value: 'all_reservations' | 'large_groups' | 'venue_default') => {
                      onFormDataChange({ charge_type: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_reservations">All reservations</SelectItem>
                      <SelectItem value="large_groups">Large groups only</SelectItem>
                      <SelectItem value="venue_default">Use venue default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.charge_type === 'large_groups' && (
                  <div>
                    <Label htmlFor="minimum_guests_for_charge">Minimum Guests for Charge</Label>
                    <Input
                      id="minimum_guests_for_charge"
                      type="number"
                      min="1"
                      value={formData.minimum_guests_for_charge}
                      onChange={(e) =>
                        onFormDataChange({ minimum_guests_for_charge: parseInt(e.target.value) || 8 })
                      }
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="charge_amount_per_guest">Charge Amount per Guest</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10">
                      £
                    </span>
                    <Input
                      id="charge_amount_per_guest"
                      type="text"
                      className="pl-8"
                      placeholder="29.95"
                      value={displayAmount}
                      onChange={(e) => handlePaymentAmountChange(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter the amount in pounds (e.g., 29.95 for £29.95)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Refund Policy Section - Only show when payments are enabled */}
          {formData.requires_payment && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded px-2 -mx-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Refund Policy</h3>
                </div>
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="refund_window_hours">Refund Window (Hours before booking)</Label>
                  <Input
                    id="refund_window_hours"
                    type="number"
                    min="0"
                    max="168"
                    value={formData.refund_window_hours || 24}
                    onChange={(e) => onFormDataChange({ refund_window_hours: parseInt(e.target.value) || 24 })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Guests can request refunds up to this many hours before their booking
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Automatic Refunds</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically process refunds for eligible cancellations
                    </p>
                  </div>
                  <Switch
                    checked={formData.auto_refund_enabled || false}
                    onCheckedChange={(checked) => onFormDataChange({ auto_refund_enabled: checked })}
                  />
                </div>

                <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                  <p><strong>Note:</strong> Make sure your Stripe account is configured to handle refunds. Refund fees may apply depending on your Stripe plan.</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">Service is available for booking</p>
            </div>
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => onFormDataChange({ active: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Secret Service</Label>
              <p className="text-sm text-muted-foreground">Only accessible via a secret link</p>
            </div>
            <Switch
              checked={formData.is_secret}
              onCheckedChange={(checked) => onFormDataChange({ is_secret: checked })}
            />
          </div>

          {formData.is_secret && (
            <div>
              <Label htmlFor="secret_slug">Secret Slug</Label>
              <Input
                id="secret_slug"
                value={formData.secret_slug}
                onChange={(e) => onFormDataChange({ secret_slug: e.target.value })}
                placeholder="secret-link-name"
              />
            </div>
          )}

          <div>
            <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
            <Textarea
              id="terms_and_conditions"
              value={formData.terms_and_conditions}
              onChange={(e) => onFormDataChange({ terms_and_conditions: e.target.value })}
              rows={6}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (isEditing ? 'Update Service' : 'Create Service')}
        </Button>
      </div>
    </form>
  );
};
