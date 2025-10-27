import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SafeHtml } from '@/components/SafeHtml';
import { supabase } from '@/integrations/supabase/client';
import { validateGuestForm, GuestFormData } from '../utils/validation';
import { useToast } from '@/hooks/use-toast';

interface GuestStepProps {
  service: any;
  venueId: string;
  onContinue: (guestData: GuestFormData) => void;
  onBack: () => void;
}

export function GuestStep({ service, venueId, onContinue, onBack }: GuestStepProps) {
  const [formData, setFormData] = useState<GuestFormData>({
    name: '',
    email: '',
    phone: '',
    notes: '',
    marketingOptIn: true,
    termsAccepted: false
  });
  
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [terms, setTerms] = useState('');
  const { toast } = useToast();
  
  useEffect(() => {
    const loadTerms = async () => {
      let termsText = service?.terms_and_conditions;
      
      if (!termsText) {
        // Use service-level terms or fallback
        termsText = 'By making this booking, you agree to our standard terms and conditions. Please contact us if you need more information.';
      }
      
      setTerms(termsText);
    };
    
    loadTerms();
  }, [service, venueId]);
  
  const handleSubmit = () => {
    const error = validateGuestForm(formData);
    if (error) {
      toast({
        title: 'Validation Error',
        description: error,
        variant: 'destructive'
      });
      return;
    }
    onContinue(formData);
  };
  
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Details</h2>
        <Button onClick={onBack} variant="ghost" size="sm">Back</Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="John Smith"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="john@example.com"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="07123 456789"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="notes">Special Requests</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Dietary requirements, accessibility needs, etc."
            className="mt-1"
            rows={3}
          />
        </div>
        
        <div className="flex items-start gap-2 pt-2">
          <Checkbox
            id="marketing"
            checked={formData.marketingOptIn}
            onCheckedChange={(checked) => 
              setFormData({...formData, marketingOptIn: checked as boolean})
            }
          />
          <Label htmlFor="marketing" className="text-sm font-normal cursor-pointer">
            Send me updates and special offers
          </Label>
        </div>
        
        <div className="flex items-start gap-2 pt-2 pb-2">
          <Checkbox
            id="terms"
            checked={formData.termsAccepted}
            onCheckedChange={(checked) => 
              setFormData({...formData, termsAccepted: checked as boolean})
            }
          />
          <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
            I accept the{' '}
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-primary underline hover:no-underline"
            >
              terms and conditions
            </button>
            {' *'}
          </Label>
        </div>
      </div>
      
      <Button
        onClick={handleSubmit}
        className="w-full h-12 text-base"
        size="lg"
      >
        Continue
      </Button>
      
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms and Conditions</DialogTitle>
          </DialogHeader>
          <SafeHtml html={terms} className="prose prose-sm max-w-none" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
