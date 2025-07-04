
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Calendar, Clock, Users, Edit, Trash2, Copy, Eye, ChevronDown, Settings } from "lucide-react";
import { DurationRulesManager } from "@/components/services/DurationRulesManager";
import { MediaUpload } from "@/components/services/MediaUpload";
import { TermsEditor } from "@/components/services/TermsEditor";
import { RichTextEditor } from "@/components/services/RichTextEditor";
import { TagSelector } from "@/components/services/TagSelector";
import { BookingWindowManager } from "@/components/services/BookingWindowManager";
import { DurationRule } from "@/hooks/useServiceDurationRules";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { sortDaysChronologically } from "@/utils/dayUtils";
import { useToast } from "@/hooks/use-toast";

// Controlled input options
const guestOptions = Array.from({length: 20}, (_, i) => i + 1);
const leadTimeOptions = [1, 2, 4, 6, 12, 24, 48, 72];
const cancellationOptions = [24, 48, 72];

const Services = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch services from database
  const { data: services = [], isLoading: isServicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch tags from database for display
  const { data: allTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch booking windows for all services with improved error handling
  const { data: allBookingWindows = [], isLoading: isLoadingWindows, error: windowsError } = useQuery({
    queryKey: ['all-booking-windows'],
    queryFn: async () => {
      console.log('Fetching booking windows...');
      const { data, error } = await supabase
        .from('booking_windows')
        .select('*')
        .order('created_at');
      
      if (error) {
        console.error('Error fetching booking windows:', error);
        throw error;
      }
      
      console.log('Raw booking windows data:', data);
      
      // Transform data with safer date parsing
      const transformedData = data.map(window => {
        try {
          const transformed = {
            ...window,
            days: sortDaysChronologically(window.days), // Sort days chronologically
            start_date: window.start_date ? new Date(window.start_date) : null,
            end_date: window.end_date ? new Date(window.end_date) : null,
            blackout_periods: Array.isArray(window.blackout_periods) 
              ? window.blackout_periods.map((bp: any) => {
                  try {
                    return {
                      ...bp,
                      startDate: bp.startDate ? new Date(bp.startDate) : new Date(),
                      endDate: bp.endDate ? new Date(bp.endDate) : new Date()
                    };
                  } catch (dateError) {
                    console.warn('Error parsing blackout period dates:', dateError, bp);
                    return {
                      ...bp,
                      startDate: new Date(),
                      endDate: new Date()
                    };
                  }
                })
              : []
          };
          
          console.log('Transformed window:', transformed);
          return transformed;
        } catch (transformError) {
          console.error('Error transforming booking window:', transformError, window);
          return {
            ...window,
            start_date: null,
            end_date: null,
            blackout_periods: []
          };
        }
      });
      
      console.log('Final transformed booking windows:', transformedData);
      return transformedData;
    }
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (newService: any) => {
      const { data, error } = await supabase
        .from('services')
        .insert([{
          ...newService,
          duration_rules: newService.durationRules,
          tag_ids: newService.tagIds
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: "Service created", description: "Your service has been created successfully." });
    },
    onError: (error) => {
      console.error('Create service error:', error);
      toast({ title: "Error", description: "Failed to create service.", variant: "destructive" });
    }
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const { data, error } = await supabase
        .from('services')
        .update({
          ...updates,
          duration_rules: updates.durationRules,
          tag_ids: updates.tagIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: "Service updated", description: "Your service has been updated successfully." });
    },
    onError: (error) => {
      console.error('Update service error:', error);
      toast({ title: "Error", description: "Failed to update service.", variant: "destructive" });
    }
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: "Service deleted", description: "Your service has been deleted successfully." });
    },
    onError: (error) => {
      console.error('Delete service error:', error);
      toast({ title: "Error", description: "Failed to delete service.", variant: "destructive" });
    }
  });

  // Log any query errors
  useEffect(() => {
    if (windowsError) {
      console.error('Booking windows query error:', windowsError);
    }
  }, [windowsError]);

  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [showWindowManager, setShowWindowManager] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);

  const [newService, setNewService] = useState({
    title: "",
    description: "",
    image_url: "",
    tag_ids: [] as string[],
    min_guests: 1,
    max_guests: 8,
    lead_time_hours: 2,
    cancellation_window_hours: 24,
    requires_deposit: false,
    deposit_per_guest: 0,
    online_bookable: true,
    active: true,
    is_secret: false,
    secret_slug: null,
    terms_and_conditions: "",
    useStandardTerms: true,
    duration_rules: [] as DurationRule[]
  });

  // Helper function to get tags for a service
  const getTagsForService = (tagIds: string[]) => {
    return allTags.filter(tag => tagIds.includes(tag.id));
  };

  // Helper function to get booking windows for a service with improved filtering
  const getWindowsForService = (serviceId: string) => {
    const windows = allBookingWindows.filter(window => window.service_id === serviceId);
    console.log(`Windows for service ${serviceId}:`, windows);
    return windows;
  };

  const generateSecretSlug = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const getStandardTerms = () => {
    return localStorage.getItem('standardTerms') || '';
  };

  const handleAddService = () => {
    const serviceData = {
      ...newService,
      secret_slug: newService.is_secret ? generateSecretSlug() : null
    };
    createServiceMutation.mutate(serviceData);
    resetServiceForm();
    setShowServiceDialog(false);
  };

  const handleUpdateService = () => {
    const updatedService = {
      ...editingService,
      secret_slug: editingService.is_secret 
        ? (editingService.secret_slug || generateSecretSlug())
        : null
    };
    updateServiceMutation.mutate({ id: editingService.id, updates: updatedService });
    setEditingService(null);
    setShowServiceDialog(false);
  };

  const handleDeleteService = (serviceId: string) => {
    deleteServiceMutation.mutate(serviceId);
  };

  const handleEditService = (service: any) => {
    setEditingService({
      ...service,
      tagIds: service.tag_ids || [],
      durationRules: Array.isArray(service.duration_rules) ? service.duration_rules : [],
      useStandardTerms: !service.terms_and_conditions || service.terms_and_conditions === getStandardTerms()
    });
    setShowServiceDialog(true);
  };

  const handleDuplicateService = (service: any) => {
    const duplicatedService = {
      ...service,
      title: `${service.title} (Copy)`,
      active: false,
      secret_slug: service.is_secret ? generateSecretSlug() : null,
      id: undefined // Remove ID so a new one will be generated
    };
    createServiceMutation.mutate(duplicatedService);
  };

  const resetServiceForm = () => {
    setNewService({
      title: "",
      description: "",
      image_url: "",
      tag_ids: [],
      min_guests: 1,
      max_guests: 8,
      lead_time_hours: 2,
      cancellation_window_hours: 24,
      requires_deposit: false,
      deposit_per_guest: 0,
      online_bookable: true,
      active: true,
      is_secret: false,
      secret_slug: null,
      terms_and_conditions: "",
      useStandardTerms: true,
      duration_rules: []
    });
    setEditingService(null);
  };

  const toggleServiceActive = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      updateServiceMutation.mutate({ 
        id: serviceId, 
        updates: { active: !service.active }
      });
    }
  };

  const handleManageWindows = (serviceId: string) => {
    setCurrentServiceId(serviceId);
    setShowWindowManager(true);
  };

  const currentFormData = editingService || newService;

  if (isServicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground">Manage your restaurant services and booking windows</p>
        </div>
        <Button onClick={() => setShowServiceDialog(true)}>
          <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
          Add Service
        </Button>
      </div>

      {/* Enhanced Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={(open) => {
        setShowServiceDialog(open);
        if (!open) resetServiceForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Service Title</Label>
                  <Input
                    id="title"
                    value={currentFormData.title}
                    onChange={(e) => editingService
                      ? setEditingService({...editingService, title: e.target.value})
                      : setNewService({...newService, title: e.target.value})
                    }
                    placeholder="e.g., Dinner Service"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="secret"
                    checked={currentFormData.is_secret}
                    onCheckedChange={(checked) => editingService
                      ? setEditingService({...editingService, is_secret: checked})
                      : setNewService({...newService, is_secret: checked})
                    }
                  />
                  <Label htmlFor="secret">Secret Service</Label>
                  {currentFormData.is_secret && (
                    <Badge variant="secondary" className="text-xs">
                      {currentFormData.secret_slug || 'auto-generated'}
                    </Badge>
                  )}
                </div>
              </div>
              
              <RichTextEditor
                value={currentFormData.description || ""}
                onChange={(value) => editingService
                  ? setEditingService({...editingService, description: value})
                  : setNewService({...newService, description: value})
                }
                label="Service Description"
                placeholder="Describe your service... Use **bold**, _italic_, and [links](url) for rich formatting."
                minHeight="min-h-[120px]"
              />

              {/* Tag Selector */}
              <TagSelector
                selectedTagIds={currentFormData.tag_ids || []}
                onTagsChange={(tagIds) => editingService
                  ? setEditingService({...editingService, tag_ids: tagIds})
                  : setNewService({...newService, tag_ids: tagIds})
                }
              />

              {/* Enhanced Image Upload */}
              <MediaUpload
                imageUrl={currentFormData.image_url || ""}
                onImageChange={(url) => editingService
                  ? setEditingService({...editingService, image_url: url})
                  : setNewService({...newService, image_url: url})
                }
                onRemove={() => editingService
                  ? setEditingService({...editingService, image_url: ""})
                  : setNewService({...newService, image_url: ""})
                }
              />

              {/* Guest and Time Controls */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="minGuests">Min Guests</Label>
                  <Select 
                    value={currentFormData.min_guests?.toString()} 
                    onValueChange={(value) => editingService
                      ? setEditingService({...editingService, min_guests: parseInt(value)})
                      : setNewService({...newService, min_guests: parseInt(value)})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {guestOptions.map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxGuests">Max Guests</Label>
                  <Select 
                    value={currentFormData.max_guests?.toString()} 
                    onValueChange={(value) => editingService
                      ? setEditingService({...editingService, max_guests: parseInt(value)})
                      : setNewService({...newService, max_guests: parseInt(value)})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {guestOptions.map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="leadTime">Lead Time (hrs)</Label>
                  <Select 
                    value={currentFormData.lead_time_hours?.toString()} 
                    onValueChange={(value) => editingService
                      ? setEditingService({...editingService, lead_time_hours: parseInt(value)})
                      : setNewService({...newService, lead_time_hours: parseInt(value)})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {leadTimeOptions.map(hours => (
                        <SelectItem key={hours} value={hours.toString()}>{hours}h</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cancellation">Cancel Window</Label>
                  <Select 
                    value={currentFormData.cancellation_window_hours?.toString()} 
                    onValueChange={(value) => editingService
                      ? setEditingService({...editingService, cancellation_window_hours: parseInt(value)})
                      : setNewService({...newService, cancellation_window_hours: parseInt(value)})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cancellationOptions.map(hours => (
                        <SelectItem key={hours} value={hours.toString()}>{hours}h</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Switches */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="deposit"
                    checked={currentFormData.requires_deposit}
                    onCheckedChange={(checked) => editingService
                      ? setEditingService({...editingService, requires_deposit: checked})
                      : setNewService({...newService, requires_deposit: checked})
                    }
                  />
                  <Label htmlFor="deposit">Requires Deposit</Label>
                </div>
                {currentFormData.requires_deposit && (
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="depositAmount">Amount per guest (£)</Label>
                    <Input
                      id="depositAmount"
                      type="number"
                      className="w-20"
                      value={currentFormData.deposit_per_guest}
                      onChange={(e) => editingService
                        ? setEditingService({...editingService, deposit_per_guest: parseInt(e.target.value)})
                        : setNewService({...newService, deposit_per_guest: parseInt(e.target.value)})
                      }
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bookable"
                    checked={currentFormData.online_bookable}
                    onCheckedChange={(checked) => editingService
                      ? setEditingService({...editingService, online_bookable: checked})
                      : setNewService({...newService, online_bookable: checked})
                    }
                  />
                  <Label htmlFor="bookable">Online Bookable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={currentFormData.active}
                    onCheckedChange={(checked) => editingService
                      ? setEditingService({...editingService, active: checked})
                      : setNewService({...newService, active: checked})
                    }
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
            </div>

            {/* Right Column - Advanced Features */}
            <div className="space-y-4">
              {/* Duration Rules */}
              <DurationRulesManager
                rules={currentFormData.duration_rules || []}
                maxGuests={currentFormData.max_guests}
                onChange={(rules) => editingService
                  ? setEditingService({...editingService, duration_rules: rules})
                  : setNewService({...newService, duration_rules: rules})
                }
              />

              {/* Terms & Conditions Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Terms & Conditions</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="useStandardTerms"
                      checked={currentFormData.useStandardTerms !== false}
                      onCheckedChange={(checked) => editingService
                        ? setEditingService({
                            ...editingService, 
                            useStandardTerms: checked,
                            terms_and_conditions: checked ? getStandardTerms() : editingService.terms_and_conditions
                          })
                        : setNewService({
                            ...newService, 
                            useStandardTerms: checked,
                            terms_and_conditions: checked ? getStandardTerms() : newService.terms_and_conditions
                          })
                      }
                    />
                    <Label htmlFor="useStandardTerms" className="text-sm">Use Standard Terms</Label>
                  </div>
                </div>
                
                {currentFormData.useStandardTerms !== false ? (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">Using standard terms & conditions</p>
                    <div className="max-h-32 overflow-y-auto text-xs bg-background p-2 rounded border">
                      {getStandardTerms() || 'No standard terms defined. Go to Settings to set them up.'}
                    </div>
                  </div>
                ) : (
                  <TermsEditor
                    value={currentFormData.terms_and_conditions || ""}
                    onChange={(value) => editingService
                      ? setEditingService({...editingService, terms_and_conditions: value})
                      : setNewService({...newService, terms_and_conditions: value})
                    }
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={editingService ? handleUpdateService : handleAddService}
              disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
            >
              {createServiceMutation.isPending || updateServiceMutation.isPending 
                ? "Saving..." 
                : editingService ? 'Update Service' : 'Add Service'
              }
            </Button>
            <Button variant="outline" onClick={() => setShowServiceDialog(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Window Manager */}
      {currentServiceId && (
        <BookingWindowManager
          serviceId={currentServiceId}
          open={showWindowManager}
          onOpenChange={(open) => {
            setShowWindowManager(open);
            if (!open) setCurrentServiceId(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const serviceTags = getTagsForService(service.tag_ids || []);
          const serviceWindows = getWindowsForService(service.id);
          const durationRules = Array.isArray(service.duration_rules) ? service.duration_rules : [];
          
          return (
            <Card key={service.id} className={`overflow-hidden ${!service.active ? 'opacity-75' : ''}`}>
              <div className="aspect-video bg-muted bg-cover bg-center" 
                   style={{ backgroundImage: service.image_url ? `url(${service.image_url})` : 'none' }} />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 mb-2">
                      {service.title}
                      {service.is_secret && (
                        <Badge variant="outline" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Secret
                        </Badge>
                      )}
                    </CardTitle>
                    
                    {/* Tags Display - Prominent under title */}
                    {serviceTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {serviceTags.map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs flex items-center gap-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    {service.online_bookable && (
                      <Badge variant="secondary">Online</Badge>
                    )}
                    {service.active ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500 border-gray-500">Inactive</Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="text-sm">{service.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Key Metrics - Always visible */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                    <span>{service.min_guests}-{service.max_guests} guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                    <span>{service.lead_time_hours}h lead</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                    <span>{service.cancellation_window_hours}h cancel</span>
                  </div>
                  {service.requires_deposit && (
                    <div className="text-sm font-medium">
                      £{service.deposit_per_guest} deposit
                    </div>
                  )}
                </div>

                {/* Collapsible Duration Rules */}
                {durationRules.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded bg-muted/50 hover:bg-muted text-sm">
                      <span className="font-medium">{durationRules.length} Duration Rules</span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-2">
                      {durationRules.map((rule: any, index: number) => (
                        <div key={rule.id || index} className="text-xs bg-muted p-2 rounded">
                          {rule.minGuests}-{rule.maxGuests} guests: {rule.durationMinutes} minutes
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Enhanced Booking Windows Display with Debug Info */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">
                      Booking Windows 
                      {isLoadingWindows && <span className="text-xs text-muted-foreground">(Loading...)</span>}
                      {windowsError && <span className="text-xs text-red-500">(Error loading)</span>}
                    </Label>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleManageWindows(service.id)}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Manage
                    </Button>
                  </div>
                  
                  {serviceWindows.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {serviceWindows.map((window) => (
                        <div key={window.id} className="text-xs bg-muted p-3 rounded">
                          <div className="font-medium mb-1">
                            {window.days.join(", ")} • {window.start_time}-{window.end_time}
                          </div>
                          
                          {(window.start_date || window.end_date) && (
                            <div className="text-muted-foreground mb-1">
                              {window.start_date && window.start_date instanceof Date && !isNaN(window.start_date.getTime()) 
                                ? format(window.start_date, 'MMM d, yyyy')
                                : 'Invalid start date'
                              }
                              {window.end_date && window.end_date instanceof Date && !isNaN(window.end_date.getTime()) 
                                ? ` - ${format(window.end_date, 'MMM d, yyyy')}`
                                : !window.end_date && window.start_date ? " (ongoing)" : ''
                              }
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Max {window.max_bookings_per_slot} bookings</span>
                            {window.blackout_periods && window.blackout_periods.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {window.blackout_periods.length} blackout{window.blackout_periods.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                      No booking windows configured
                      {!isLoadingWindows && !windowsError && (
                        <div className="mt-1 text-[10px]">
                          Service ID: {service.id}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions - Grouped better */}
                <div className="flex gap-2 pt-2 border-t">
                  <div className="flex gap-1 flex-1">
                    <Button variant="outline" size="sm" onClick={() => handleEditService(service)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDuplicateService(service)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toggleServiceActive(service.id)}
                      className={service.active ? "text-orange-600" : "text-green-600"}
                    >
                      {service.active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteService(service.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Services;
