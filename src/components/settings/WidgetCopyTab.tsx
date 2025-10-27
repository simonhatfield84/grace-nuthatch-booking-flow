import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RotateCcw, Save, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useVenueWidgetCopy, DEFAULT_HOLD_BANNER_COPY, type HoldBannerCopy } from '@/hooks/useVenueWidgetCopy';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function WidgetCopyTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [venueId, setVenueId] = useState<string>('');
  const [holdBanner, setHoldBanner] = useState<HoldBannerCopy>(DEFAULT_HOLD_BANNER_COPY);
  
  const { copy, isLoading, updateCopy } = useVenueWidgetCopy(venueId, true);

  // Fetch venue ID
  useEffect(() => {
    if (user) {
      const fetchVenueId = async () => {
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('venue_id')
          .eq('id', user.id)
          .single();
        
        if (profile?.venue_id) {
          setVenueId(profile.venue_id);
        }
      };
      
      fetchVenueId();
    }
  }, [user]);

  // Load current copy
  useEffect(() => {
    if (copy?.holdBanner) {
      setHoldBanner({ ...DEFAULT_HOLD_BANNER_COPY, ...copy.holdBanner });
    }
  }, [copy]);

  const handleSave = async () => {
    try {
      await updateCopy.mutateAsync({ holdBanner });
      toast({
        title: 'Copy saved',
        description: 'Your widget copy has been updated successfully'
      });
    } catch (error) {
      console.error('Failed to save copy:', error);
      toast({
        title: 'Save failed',
        description: 'Unable to save widget copy',
        variant: 'destructive'
      });
    }
  };

  const handleReset = () => {
    setHoldBanner(DEFAULT_HOLD_BANNER_COPY);
    toast({
      title: 'Reset to defaults',
      description: 'Copy has been reset. Click Save to apply.'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const charCount = (text?: string, max?: number) => {
    const length = text?.length || 0;
    if (!max) return `${length} characters`;
    return `${length}/${max} characters`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Copy</CardTitle>
        <CardDescription>
          Customize the text that appears in your booking widget. Use {'{time}'} to insert the countdown timer.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Changes will appear in your live booking widget immediately after saving.
          </AlertDescription>
        </Alert>

        <Accordion type="single" collapsible defaultValue="hold-banner" className="w-full">
          <AccordionItem value="hold-banner">
            <AccordionTrigger className="text-lg font-semibold">
              Hold Banner
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="hold-title">Title</Label>
                <Input
                  id="hold-title"
                  value={holdBanner.title || ''}
                  onChange={(e) => setHoldBanner({ ...holdBanner, title: e.target.value })}
                  placeholder="We're holding your table"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {charCount(holdBanner.title, 100)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hold-subtitle">Subtitle</Label>
                <Textarea
                  id="hold-subtitle"
                  value={holdBanner.subtitle || ''}
                  onChange={(e) => setHoldBanner({ ...holdBanner, subtitle: e.target.value })}
                  placeholder="Complete your details within {time}, or the hold releases automatically."
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {charCount(holdBanner.subtitle, 200)} • Use {'{time}'} to show the countdown
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hold-urgent">Urgent Warning (shown when {'<'} 60 seconds)</Label>
                <Input
                  id="hold-urgent"
                  value={holdBanner.urgentWarning || ''}
                  onChange={(e) => setHoldBanner({ ...holdBanner, urgentWarning: e.target.value })}
                  placeholder="⏰ Complete your booking soon!"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {charCount(holdBanner.urgentWarning, 100)}
                </p>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold mb-3">Expiry Messages</h4>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="expired-title">Expired Toast Title</Label>
                    <Input
                      id="expired-title"
                      value={holdBanner.expiredTitle || ''}
                      onChange={(e) => setHoldBanner({ ...holdBanner, expiredTitle: e.target.value })}
                      placeholder="Time slot expired"
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      {charCount(holdBanner.expiredTitle, 100)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expired-message">Expired Toast Message</Label>
                    <Textarea
                      id="expired-message"
                      value={holdBanner.expiredMessage || ''}
                      onChange={(e) => setHoldBanner({ ...holdBanner, expiredMessage: e.target.value })}
                      placeholder="Please select a new time"
                      rows={2}
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground">
                      {charCount(holdBanner.expiredMessage, 200)}
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex gap-2 pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={updateCopy.isPending}
            className="flex-1"
          >
            {updateCopy.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to default copy?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will restore all widget copy to the default text. You'll need to click Save to apply the changes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
