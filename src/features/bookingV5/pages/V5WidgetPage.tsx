import { useParams } from 'react-router-dom';
import { V5BookingWidget } from '../components/V5BookingWidget';

export default function V5WidgetPage() {
  const { venueSlug } = useParams<{ venueSlug: string }>();
  
  if (!venueSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Invalid venue URL</p>
      </div>
    );
  }
  
  return <V5BookingWidget venueSlug={venueSlug} />;
}
