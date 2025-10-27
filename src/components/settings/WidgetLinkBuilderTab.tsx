import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWidgetLinkBuilder, WidgetLinkParams, WidgetLinkUTM } from '@/hooks/useWidgetLinkBuilder';
import { validateLinkParams } from '@/features/bookingV5/utils/linkValidation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link, Copy, ExternalLink, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VenueInfo {
  id: string;
  slug: string;
  name: string;
}

export function WidgetLinkBuilderTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [venueInfo, setVenueInfo] = useState<VenueInfo | null>(null);
  const { links, isLoading, createLink, deleteLink } = useWidgetLinkBuilder(venueInfo?.id || '');
  
  // Fetch venue info
  useEffect(() => {
    if (user) {
      const fetchVenueInfo = async () => {
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('venue_id')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.venue_id) {
          const { data: venue } = await (supabase as any)
            .from('venues')
            .select('id, slug, name')
            .eq('id', profile.venue_id)
            .single();
          
          if (venue) {
            setVenueInfo(venue);
          }
        }
      };
      
      fetchVenueInfo();
    }
  }, [user]);
  
  // Form state
  const [variant, setVariant] = useState<'standard' | 'serviceFirst'>('standard');
  const [party, setParty] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [utmSource, setUtmSource] = useState<string>('');
  const [utmMedium, setUtmMedium] = useState<string>('');
  const [utmCampaign, setUtmCampaign] = useState<string>('');
  const [utmContent, setUtmContent] = useState<string>('');
  const [utmTerm, setUtmTerm] = useState<string>('');
  
  const [generatedLink, setGeneratedLink] = useState<{ url: string; slug: string } | null>(null);

  // Fetch venue services
  const { data: services = [] } = useQuery({
    queryKey: ['venue-services', venueInfo?.id],
    queryFn: async () => {
      if (!venueInfo?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from('services')
        .select('id, title, min_guests, max_guests')
        .eq('venue_id', venueInfo.id)
        .eq('is_active', true)
        .order('title');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!venueInfo?.id
  });

  const handleGenerate = async () => {
    if (!venueInfo) return;

    // Build params
    const params: WidgetLinkParams = { variant };
    if (party) params.party = parseInt(party, 10);
    if (date) params.date = date;
    if (serviceId) params.service = serviceId;

    // Build UTM
    const utm: WidgetLinkUTM = {};
    if (utmSource) utm.utm_source = utmSource;
    if (utmMedium) utm.utm_medium = utmMedium;
    if (utmCampaign) utm.utm_campaign = utmCampaign;
    if (utmContent) utm.utm_content = utmContent;
    if (utmTerm) utm.utm_term = utmTerm;

    // Validate
    const validation = await validateLinkParams(venueInfo.id, params);
    if (!validation.valid) {
      toast({
        title: 'Validation Error',
        description: validation.errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    // Create link
    try {
      const result = await createLink.mutateAsync({ params, utm });
      
      // Build URL
      const url = buildURL(venueInfo.slug, params, utm);
      setGeneratedLink({ url, slug: result.slug });
      
      toast({
        title: 'Link Generated!',
        description: 'Your booking link has been created successfully.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate link',
        variant: 'destructive'
      });
    }
  };

  const buildURL = (venueSlug: string, params: WidgetLinkParams, utm: WidgetLinkUTM): string => {
    const urlParams = new URLSearchParams();
    if (params.variant) urlParams.set('variant', params.variant);
    if (params.party) urlParams.set('party', params.party.toString());
    if (params.date) urlParams.set('date', params.date);
    if (params.service) urlParams.set('service', params.service);
    
    Object.entries(utm).forEach(([key, value]) => {
      if (value) urlParams.set(key, value);
    });
    
    return `${window.location.origin}/booking/${venueSlug}/v5?${urlParams.toString()}`;
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'Copied!', description: 'Link copied to clipboard' });
  };

  const handleOpenTest = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDelete = async (linkId: string) => {
    try {
      await deleteLink.mutateAsync(linkId);
      toast({ title: 'Deleted', description: 'Link removed successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete link', variant: 'destructive' });
    }
  };

  if (!venueInfo) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground text-center">Loading venue information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Link Builder</CardTitle>
        <CardDescription>
          Create custom booking links with pre-filled parameters and UTM tracking
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Form Builder */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Booking Flow Variant</Label>
              <RadioGroup value={variant} onValueChange={(v) => setVariant(v as 'standard' | 'serviceFirst')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard">Standard Flow</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="serviceFirst" id="serviceFirst" />
                  <Label htmlFor="serviceFirst">Service First</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="party">Party Size (optional)</Label>
              <Input
                id="party"
                type="number"
                min={1}
                max={50}
                value={party}
                onChange={(e) => setParty(e.target.value)}
                placeholder="e.g., 4"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date (optional)</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service">Service (optional)</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title} ({s.min_guests}-{s.max_guests} guests)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label>UTM Parameters (optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="utm_source (e.g., instagram)"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
              />
              <Input
                placeholder="utm_medium (e.g., social)"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
              />
              <Input
                placeholder="utm_campaign (e.g., summer-promo)"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
              />
              <Input
                placeholder="utm_content (e.g., story-cta)"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
              />
              <Input
                placeholder="utm_term"
                value={utmTerm}
                onChange={(e) => setUtmTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <Button onClick={handleGenerate} className="w-full" disabled={createLink.isPending}>
          <Link className="mr-2 h-4 w-4" />
          {createLink.isPending ? 'Generating...' : 'Generate Link'}
        </Button>
        
        {/* Generated Link Display */}
        {generatedLink && (
          <Alert>
            <AlertTitle>Link Generated!</AlertTitle>
            <AlertDescription className="space-y-2">
              <div className="flex gap-2 items-center">
                <Input value={generatedLink.url} readOnly className="font-mono text-sm" />
                <Button onClick={() => handleCopy(generatedLink.url)} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button onClick={() => handleOpenTest(generatedLink.url)} variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Short slug: <span className="font-mono">{generatedLink.slug}</span>
              </p>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Link History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Saved Links</h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : links.length === 0 ? (
            <p className="text-sm text-muted-foreground">No links created yet</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Parameters</TableHead>
                    <TableHead>UTM</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => {
                    const url = buildURL(venueInfo.slug, link.params, link.utm);
                    return (
                      <TableRow key={link.id}>
                        <TableCell className="font-mono text-sm">{link.slug}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(link.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline">{link.params.variant || 'standard'}</Badge>
                            {link.params.party && <Badge variant="secondary">Party: {link.params.party}</Badge>}
                            {link.params.date && (
                              <Badge variant="secondary">
                                <Calendar className="h-3 w-3 mr-1" />
                                {link.params.date}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {link.utm.utm_source && (
                            <Badge variant="outline">{link.utm.utm_source}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{link.click_count || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button onClick={() => handleCopy(url)} size="sm" variant="ghost">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => handleOpenTest(url)} size="sm" variant="ghost">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(link.id)}
                              size="sm"
                              variant="ghost"
                              disabled={deleteLink.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
