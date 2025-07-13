import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculatePaymentAmount } from "@/utils/paymentCalculation";

interface GuestDetailsStepProps {
  value: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
    marketingOptIn: boolean;
    termsAccepted: boolean;
  } | null;
  service: any;
  venue: any;
  partySize: number;
  onChange: (details: any, paymentRequired: boolean, paymentAmount: number) => void;
}

export function GuestDetailsStep({ value, service, venue, partySize, onChange }: GuestDetailsStepProps) {
  const [formData, setFormData] = useState({
    name: value?.name || '',
    email: value?.email || '',
    phone: value?.phone || '',
    notes: value?.notes || '',
    marketingOptIn: value?.marketingOptIn ?? true,
    termsAccepted: value?.termsAccepted || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTerms, setShowTerms] = useState(false);
  const [terms, setTerms] = useState('');
  const [paymentCalculation, setPaymentCalculation] = useState<any>(null);

  // Load terms and conditions and calculate payment
  useEffect(() => {
    const loadData = async () => {
      // Load terms
      let termsText = service?.terms_and_conditions;
      
      if (!termsText && venue?.id) {
        termsText = "Standard booking terms and conditions apply. By proceeding, you agree to our cancellation policy and terms of service.";
      }
      
      setTerms(termsText || "Standard booking terms and conditions apply.");

      // Calculate payment
      if (service?.id && venue?.id) {
        const calculation = await calculatePaymentAmount(service.id, partySize, venue.id);
        setPaymentCalculation(calculation);
      }
    };

    loadData();
  }, [service, venue, partySize]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid mobile number';
    }

    // Email validation - will be required in future
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions to proceed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const paymentRequired = paymentCalculation?.shouldCharge || false;
      const paymentAmount = paymentCalculation?.amount || 0;

      onChange(formData, paymentRequired, paymentAmount);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
          Guest Details
        </h2>
        <p className="text-nuthatch-muted">
          Please provide your contact information
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-nuthatch-dark">
            Full Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={`mt-1 border-nuthatch-border focus:border-nuthatch-green ${
              errors.name ? 'border-red-500' : ''
            }`}
            placeholder="Enter your full name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="text-nuthatch-dark">
            Mobile Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className={`mt-1 border-nuthatch-border focus:border-nuthatch-green ${
              errors.phone ? 'border-red-500' : ''
            }`}
            placeholder="Enter your mobile number"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-nuthatch-dark">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className={`mt-1 border-nuthatch-border focus:border-nuthatch-green ${
              errors.email ? 'border-red-500' : ''
            }`}
            placeholder="Enter your email address (optional)"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
          <p className="text-sm text-nuthatch-muted mt-1">
            Optional for now, but recommended for booking confirmations
          </p>
        </div>

        <div>
          <Label htmlFor="notes" className="text-nuthatch-dark">
            Special Requests
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            className="mt-1 border-nuthatch-border focus:border-nuthatch-green"
            placeholder="Allergies, dietary requirements, special occasions..."
            rows={3}
          />
        </div>
      </div>

      {/* Payment Information */}
      {paymentCalculation?.shouldCharge && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {paymentCalculation.description} - £{paymentCalculation.amount.toFixed(2)}
            {paymentCalculation.chargeType === 'error' ? 
              ' (Payment system not configured)' : 
              '. You will be taken to our secure payment page next.'
            }
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 pt-4 border-t border-nuthatch-border">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="marketing"
            checked={formData.marketingOptIn}
            onCheckedChange={(checked) => updateField('marketingOptIn', checked)}
            className="mt-1"
          />
          <div>
            <Label htmlFor="marketing" className="text-nuthatch-dark text-sm">
              I would like to receive marketing communications
            </Label>
            <p className="text-xs text-nuthatch-muted">
              Get updates about special offers and events at The Nuthatch
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={formData.termsAccepted}
            onCheckedChange={(checked) => updateField('termsAccepted', checked)}
            className="mt-1"
          />
          <div>
            <Label htmlFor="terms" className="text-nuthatch-dark text-sm">
              I accept the{' '}
              <button
                type="button"
                onClick={() => setShowTerms(!showTerms)}
                className="text-nuthatch-green underline hover:no-underline"
              >
                terms and conditions
              </button>
              *
            </Label>
            {errors.terms && (
              <p className="text-red-500 text-sm mt-1">{errors.terms}</p>
            )}
          </div>
        </div>

        {showTerms && (
          <Card className="p-4 bg-nuthatch-light border-nuthatch-border">
            <h4 className="font-medium text-nuthatch-dark mb-2">
              Terms and Conditions
            </h4>
            <div className="text-sm text-nuthatch-dark whitespace-pre-wrap max-h-40 overflow-y-auto">
              {terms}
            </div>
          </Card>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full bg-nuthatch-green hover:bg-nuthatch-dark text-nuthatch-white"
        disabled={!formData.name || !formData.phone || !formData.termsAccepted}
      >
        {paymentCalculation?.shouldCharge ? 'Continue to Payment' : 'Complete Booking'}
      </Button>
    </div>
  );
}