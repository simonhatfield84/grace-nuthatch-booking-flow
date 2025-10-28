
import React from 'react';
import * as Sentry from '@sentry/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  eventId?: string; // Sentry event ID for user feedback
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Application Error Boundary caught an error:', error, errorInfo);
    
    // Send to Sentry with additional context
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
    
    this.setState({ error, errorInfo, eventId });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="text-destructive">Application Error</CardTitle>
              <CardDescription>
                Something went wrong. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <details>
                  <summary className="cursor-pointer">Error Details</summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {this.state.error?.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              </div>
              
              {/* Optional: Report feedback button */}
              {this.state.eventId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    Sentry.showReportDialog({
                      eventId: this.state.eventId,
                      title: 'It looks like we\'re having issues',
                      subtitle: 'Our team has been notified',
                      subtitle2: 'If you\'d like to help, tell us what happened below.',
                    });
                  }}
                  className="w-full"
                >
                  Report Feedback
                </Button>
              )}
              
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
