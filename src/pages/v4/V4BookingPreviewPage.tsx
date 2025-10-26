import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { V4BookingWidget } from "@/features/bookingV4/V4BookingWidget";
import { StripeProvider } from "@/components/providers/StripeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function V4BookingPreviewPage() {
  const { venueSlug } = useParams<{ venueSlug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const checkAuthorization = async () => {
      try {
        const { data: venue } = await supabase
          .from('venues')
          .select('id')
          .eq('slug', venueSlug)
          .single();

        if (!venue) {
          setIsAuthorized(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('venue_id, role')
          .eq('id', user.id)
          .single();

        const isAdmin = profile?.venue_id === venue.id && ['owner', 'manager'].includes(profile?.role);
        setIsAuthorized(isAdmin);
      } catch (error) {
        console.error('Authorization check failed:', error);
        setIsAuthorized(false);
      }
    };

    checkAuthorization();
  }, [user, venueSlug, navigate]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You do not have permission to preview this venue's booking widget.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <StripeProvider>
      <V4BookingWidget isPreview={true} />
    </StripeProvider>
  );
}
