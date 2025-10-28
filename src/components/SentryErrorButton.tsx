import * as Sentry from "@sentry/react";
import { Button } from "@/components/ui/button";

export function SentryErrorButton() {
  const triggerError = () => {
    // Log a message to Sentry
    Sentry.captureMessage("User triggered test error from booking widget");
    
    // Set user context (anonymous ID only)
    Sentry.setUser({ id: 'test-user-123' });
    
    // Add breadcrumb
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'User clicked test error button',
      level: 'info',
    });
    
    // Throw error to trigger ErrorBoundary + Sentry
    throw new Error("This is your first Sentry error!");
  };

  return (
    <Button
      onClick={triggerError}
      variant="destructive"
      className="fixed bottom-4 right-4 z-50"
    >
      🧪 Test Sentry Error
    </Button>
  );
}
