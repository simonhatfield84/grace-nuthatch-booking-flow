
import { supabase } from "@/integrations/supabase/client";

interface ErrorDetails {
  message: string;
  stack?: string;
  url?: string;
  line?: number;
  column?: number;
  userAgent?: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

class PlatformErrorCapture {
  private enabled: boolean = false;
  private sessionId: string;

  constructor() {
    this.sessionId = Math.random().toString(36).substring(2, 15);
  }

  enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    
    // Capture unhandled errors
    window.addEventListener('error', this.handleError.bind(this));
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleRejection.bind(this));
    
    console.log('Platform error capture enabled');
  }

  disable() {
    if (!this.enabled) return;
    
    this.enabled = false;
    
    window.removeEventListener('error', this.handleError.bind(this));
    window.removeEventListener('unhandledrejection', this.handleRejection.bind(this));
    
    console.log('Platform error capture disabled');
  }

  private async handleError(event: ErrorEvent) {
    if (!this.enabled) return;
    
    const errorDetails: ErrorDetails = {
      message: event.message,
      stack: event.error?.stack,
      url: event.filename,
      line: event.lineno,
      column: event.colno,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    await this.logError(errorDetails);
  }

  private async handleRejection(event: PromiseRejectionEvent) {
    if (!this.enabled) return;
    
    const errorDetails: ErrorDetails = {
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    await this.logError(errorDetails);
  }

  private async logError(errorDetails: ErrorDetails) {
    try {
      const { error } = await supabase.functions.invoke('platform-log-client-error', {
        body: errorDetails
      });

      if (error) {
        console.error('Failed to log client error:', error);
      }
    } catch (err) {
      console.error('Error logging client error:', err);
    }
  }

  // Manual error reporting
  async reportError(error: Error, context?: any) {
    if (!this.enabled) return;
    
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    if (context) {
      errorDetails.userId = context.userId;
    }

    await this.logError(errorDetails);
  }
}

export const platformErrorCapture = new PlatformErrorCapture();

// Auto-enable for platform admin routes
if (window.location.pathname.startsWith('/platform/')) {
  platformErrorCapture.enable();
}
