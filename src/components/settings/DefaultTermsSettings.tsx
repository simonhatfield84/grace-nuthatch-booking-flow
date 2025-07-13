
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export const DefaultTermsSettings = () => {
  const [terms, setTerms] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load existing terms from localStorage
    const savedTerms = localStorage.getItem('standardTerms') || '';
    setTerms(savedTerms);
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('standardTerms', terms);
      toast({
        title: "Success",
        description: "Default terms and conditions have been saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save terms and conditions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTermsTemplate = `Terms and Conditions for Booking

1. BOOKING CONFIRMATION
Your booking is confirmed upon receipt of this confirmation. Please arrive on time for your reservation.

2. CANCELLATION POLICY
Cancellations must be made at least 24 hours in advance. Late cancellations may incur charges.

3. PARTY SIZE
The number of guests must not exceed the party size specified in your booking. Additional guests may not be accommodated.

4. PAYMENT
Payment may be required at the time of booking or upon arrival, as specified during the booking process.

5. NO-SHOW POLICY
Failure to arrive within 15 minutes of your booking time may result in your table being released to other guests.

6. SPECIAL REQUIREMENTS
Please inform us of any dietary requirements or accessibility needs at the time of booking.

7. AMENDMENTS
Any changes to your booking must be made by contacting us directly and are subject to availability.

8. LIABILITY
We accept no responsibility for loss or damage to personal property while on our premises.`;

  const handleUseTemplate = () => {
    setTerms(defaultTermsTemplate);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Terms and Conditions</CardTitle>
        <CardDescription>
          Set the standard terms and conditions that will be used for all services by default. 
          Individual services can override these with custom terms if needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="terms">Terms and Conditions</Label>
          <Textarea
            id="terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Enter your default terms and conditions..."
            rows={12}
            className="min-h-[300px]"
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Terms'}
          </Button>
          <Button variant="outline" onClick={handleUseTemplate}>
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
