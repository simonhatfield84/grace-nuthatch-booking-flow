import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useV4WidgetConfig } from "@/hooks/useV4WidgetConfig";
import { usePublicStripeSettings } from "@/hooks/usePublicStripeSettings";
import { useVenueBySlug } from "@/hooks/useVenueBySlug";
import { PartyDateStep } from "./steps/PartyDateStep";
import { ServiceStep } from "./steps/ServiceStep";
import { TimeStep } from "./steps/TimeStep";
import { GuestDetailsStep } from "./steps/GuestDetailsStep";
import { ConfirmationStep } from "./steps/ConfirmationStep";
import { V4Header } from "./shared/V4Header";
import { V4ProgressIndicator } from "./shared/V4ProgressIndicator";
import { SafeHtml } from "@/components/ui/safe-html";
import "../../styles/v4-widget.css";

export interface V4BookingData {
  partySize: number;
  date: Date | null;
  service: any | null;
  time: string;
  lockToken: string | null;
  guestDetails: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
    marketingOptIn: boolean;
    termsAccepted: boolean;
  } | null;
  paymentRequired: boolean;
  paymentAmount: number;
  bookingId: number | null;
}

interface V4BookingWidgetProps {
  isPreview?: boolean;
}

export function V4BookingWidget({ isPreview = false }: V4BookingWidgetProps) {
  const { venueSlug } = useParams<{ venueSlug: string }>();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<V4BookingData>({
    partySize: 2,
    date: null,
    service: null,
    time: '',
    lockToken: null,
    guestDetails: null,
    paymentRequired: false,
    paymentAmount: 0,
    bookingId: null,
  });

  const { data: venue, isLoading: venueLoading, error: venueError } = useVenueBySlug(venueSlug || '');
  const { data: config, isLoading: configLoading } = useV4WidgetConfig(venueSlug || '');
  const { publishableKey, isTestMode, isActive } = usePublicStripeSettings({ venueSlug: venueSlug || '' });

  useEffect(() => {
    if (config) {
      const root = document.documentElement;
      root.style.setProperty('--brand-primary', config.primary_color);
      root.style.setProperty('--brand-secondary', config.secondary_color);
      root.style.setProperty('--brand-accent', config.accent_color);
      root.style.setProperty('--brand-font-heading', `'${config.font_heading}', sans-serif`);
      root.style.setProperty('--brand-font-body', `'${config.font_body}', sans-serif`);
      
      const radiusMap: Record<string, string> = {
        sm: '4px',
        md: '6px',
        lg: '8px',
        full: '999px'
      };
      root.style.setProperty('--brand-button-radius', radiusMap[config.button_radius] || '6px');
    }
  }, [config]);

  const steps = [
    { id: 'party-date', name: 'Party & Date' },
    { id: 'service', name: 'Service' },
    { id: 'time', name: 'Time' },
    { id: 'details', name: 'Details' },
    { id: 'confirmation', name: 'Confirmation' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateBookingData = (updates: Partial<V4BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  };

  if (venueLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (venueError || !venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Venue Not Found</h2>
          <p className="text-muted-foreground">
            The venue "{venueSlug}" could not be found or is not available for bookings.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="v4-widget min-h-screen bg-background"
      data-button-radius={config?.button_radius || 'md'}
    >
      {config?.flags_json?.showHero && (
        <div
          className="relative h-64 md:h-96 bg-cover bg-center"
          style={{
            backgroundImage: config.hero_image_url
              ? `url(${config.hero_image_url})`
              : `linear-gradient(135deg, ${config?.primary_color || '#0ea5a0'} 0%, ${config?.secondary_color || '#111827'} 100%)`
          }}
        >
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="v4-heading text-4xl md:text-5xl font-bold mb-4">
                {config?.copy_json?.heroHeading || 'Book Your Experience'}
              </h1>
              <p className="v4-body text-lg md:text-xl">
                {config?.copy_json?.heroSubheading || 'Reserve your table in just a few clicks'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isPreview && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">
              🔍 Preview Mode - This is how your V4 booking widget will appear to guests
            </p>
          </div>
        )}

        <V4Header
          logoUrl={config?.logo_url}
          venueName={config?.venue_name || venue.name}
          primaryColor={config?.primary_color}
        />

        {config?.flags_json?.showAbout && config?.about_html && (
          <Card className="mb-6 p-6">
            <SafeHtml html={config.about_html} className="prose max-w-none v4-body" />
          </Card>
        )}

        <V4ProgressIndicator
          steps={steps}
          currentStep={currentStep}
          accentColor={config?.accent_color}
        />

        <Card className="p-6 mt-6">
          {currentStep === 0 && (
            <PartyDateStep
              bookingData={bookingData}
              venueId={venue.id}
              onUpdate={updateBookingData}
              onNext={handleNext}
              config={config}
            />
          )}
          {currentStep === 1 && (
            <ServiceStep
              bookingData={bookingData}
              venueId={venue.id}
              onUpdate={updateBookingData}
              onNext={handleNext}
              onBack={handleBack}
              config={config}
            />
          )}
          {currentStep === 2 && (
            <TimeStep
              bookingData={bookingData}
              venueSlug={venueSlug || ''}
              onUpdate={updateBookingData}
              onNext={handleNext}
              onBack={handleBack}
              config={config}
            />
          )}
          {currentStep === 3 && (
            <GuestDetailsStep
              bookingData={bookingData}
              venueId={venue.id}
              venueSlug={venueSlug || ''}
              venueName={venue.name}
              onUpdate={updateBookingData}
              onNext={handleNext}
              onBack={handleBack}
              config={config}
            />
          )}
          {currentStep === 4 && (
            <ConfirmationStep
              bookingData={bookingData}
              venueName={venue.name}
              config={config}
            />
          )}
        </Card>

        {config?.flags_json?.showDepositExplainer && bookingData.paymentRequired && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 v4-body">
              💳 {config?.copy_json?.depositExplainer || 'A small deposit secures your booking and will be deducted from your final bill.'}
            </p>
          </div>
        )}
        
        {config?.flags_json?.showAllergyNote && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800 v4-body">
              ⚠️ {config?.copy_json?.allergyNote || 'Please inform staff of any dietary requirements upon arrival.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
