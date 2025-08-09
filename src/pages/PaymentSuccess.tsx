
import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-nuthatch-cream flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-nuthatch-border">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <img 
            src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" 
            alt="The Nuthatch" 
            className="h-16 w-auto mb-6"
          />
          <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
          <h1 className="text-3xl font-nuthatch-heading font-light text-nuthatch-dark mb-2">
            Payment Successful!
          </h1>
          <p className="text-nuthatch-muted mb-6">
            Thank you for your payment. Your booking has been confirmed and you'll receive a confirmation email shortly.
          </p>
          <p className="text-sm text-nuthatch-muted">
            We look forward to welcoming you at The Nuthatch!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
