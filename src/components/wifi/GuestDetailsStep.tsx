
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, User } from 'lucide-react';
import type { GuestFormData } from './WifiPortalFlow';

interface Venue {
  id: string;
  name: string;
}

interface GuestDetailsStepProps {
  venue: Venue;
  onSubmit: (data: Partial<GuestFormData>) => void;
  isLoading: boolean;
}

export function GuestDetailsStep({ venue, onSubmit, isLoading }: GuestDetailsStepProps) {
  const [formData, setFormData] = useState<Partial<GuestFormData>>({
    name: '',
    email: '',
    phone: '',
    marketing_consent: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateField = (field: keyof GuestFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Guest Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Please provide your details to access WiFi at {venue.name}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter your full name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="Enter your email address"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="Enter your phone number"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-xs text-destructive mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="flex items-start space-x-3 p-3 bg-secondary/50 rounded-lg">
              <Checkbox
                id="marketing"
                checked={formData.marketing_consent || false}
                onCheckedChange={(checked) => updateField('marketing_consent', !!checked)}
              />
              <div className="text-sm space-y-1">
                <Label htmlFor="marketing" className="font-normal cursor-pointer">
                  Keep me informed about events and offers
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive updates about upcoming events, special offers, and news from {venue.name}
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
