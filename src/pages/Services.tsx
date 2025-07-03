
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// Controlled input options
const guestOptions = Array.from({length: 20}, (_, i) => i + 1);
const leadTimeOptions = [1, 2, 4, 6, 12, 24, 48, 72];
const cancellationOptions = [24, 48, 72];

const Services = () => {
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

  // Fetch booking windows for all services
  const { data: allBookingWindows = [] } = useQuery({
    queryKey: ['all-booking-windows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_windows')
        .select('*')
        .order('created_at');
      
      if (error) throw error;
      
      return data.map(window => ({
        ...window,
        start_date: window.start_date ? new Date(window.start_date) : null,
        end_date: window.end_date ? new Date(window.end_date) : null,
        blackout_periods: Array.isArray(window.blackout_periods) ? window.blackout_periods.map((bp: any) => ({
          ...bp,
          startDate: new Date(bp.startDate),
          endDate: new Date(bp.endDate)
        })) : []
      }));
    }
  });

  const [services, setServices] = useState([
    {
      id: 1,
      title: "Dinner Service",
      description: "Evening dining experience with seasonal menu",
      imageUrl: "/api/placeholder/400/200",
      tagIds: [] as string[],
      minGuests: 1,
      maxGuests: 8,
      leadTimeHours: 2,
      cancellationWindowHours: 24,
      requiresDeposit: true,
      depositPerGuest: 25,
      onlineBookable: true,
      active: true,
      isSecret: false,
      secretSlug: null,
      termsAndConditions: "",
      durationRules: [
        { id: "1", minGuests: 1, maxGuests: 2, durationMinutes: 90 },
        { id: "2", minGuests: 3, maxGuests: 6, durationMinutes: 120 },
        { id: "3", minGuests: 7, maxGuests: 8, durationMinutes: 150 }
      ] as DurationRule[]
    },
    {
      id: 2,
      title: "Afternoon Tea",
      description: "Traditional afternoon tea with homemade scones and cakes",
      imageUrl: "/api/placeholder/400/200",
      tagIds: [] as string[],
      minGuests: 2,
      maxGuests: 6,
      leadTimeHours: 24,
      cancellationWindowHours: 48,
      requiresDeposit: false,
      depositPerGuest: 0,
      onlineBookable: true,
      active: true,
      isSecret: false,
      secretSlug: null,
      termsAndConditions: "",
      durationRules: [
        { id: "1", minGuests: 2, maxGuests: 4, durationMinutes: 90 },
        { id: "2", minGuests: 5, maxGuests: 6, durationMinutes: 105 }
      ] as DurationRule[]
    }
  ]);

  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [showWindowManager, setShowWindowManager] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<number | null>(null);

  const [newService, setNewService] = useState({
    title: "",
    description: "",
    imageUrl: "",
    tagIds: [] as string[],
    minGuests: 1,
    maxGuests: 8,
    leadTimeHours: 2,
    cancellationWindowHours: 24,
    requiresDeposit: false,
    depositPerGuest: 0,
    onlineBookable: true,
    active: true,
    isSecret: false,
    secretSlug: null,
    termsAndConditions: "",
    useStandardTerms: true,
    durationRules: [] as DurationRule[]
  });

  // Helper function to get tags for a service
  const getTagsForService = (tagIds: string[]) => {
    return allTags.filter(tag => tagIds.includes(tag.id));
  };

  // Helper function to get booking windows for a service
  const getWindowsForService = (serviceId: number) => {
    return allBookingWindows.filter(window => window.service_id === serviceId.toString());
  };

  const generateSecretSlug = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const getStandardTerms = () => {
    return localStorage.getItem('standardTerms') || '';
  };

  const handleAddService = () => {
    const service = {
      id: Date.now(),
      ...newService,
      secretSlug: newService.isSecret ? generateSecretSlug() : null
    };
    setServices([...services, service]);
    resetServiceForm();
    setShowServiceDialog(false);
  };

  const handleUpdateService = () => {
    const updatedService = {
      ...editingService,
      secretSlug: editingService.isSecret 
        ? (editingService.secretSlug || generateSecretSlug())
        : null
    };
    setServices(services.map(s => s.id === editingService.id ? updatedService : s));
    setEditingService(null);
    setShowServiceDialog(false);
  };

  const handleDeleteService = (serviceId: number) => {
    setServices(services.filter(s => s.id !== serviceId));
  };

  const handleEditService = (service: any) => {
    setEditingService({
      ...service,
      tagIds: service.tagIds || []
    });
    setShowServiceDialog(true);
  };

  const handleDuplicateService = (service: any) => {
    const duplicatedService = {
      ...service,
      id: Date.now(),
      title: `${service.title} (Copy)`,
      active: false,
      secretSlug: service.isSecret ? generateSecretSlug() : null
    };
    setServices([...services, duplicatedService]);
  };

  const resetServiceForm = () => {
    setNewService({
      title: "",
      description: "",
      imageUrl: "",
      tagIds: [],
      minGuests: 1,
      maxGuests: 8,
      leadTimeHours: 2,
      cancellationWindowHours: 24,
      requiresDeposit: false,
      depositPerGuest: 0,
      onlineBookable: true,
      active: true,
      isSecret: false,
      secretSlug: null,
      termsAndConditions: "",
      useStandardTerms: true,
      durationRules: []
    });
    setEditingService(null);
  };

  const toggleServiceActive = (serviceId: number) => {
    setServices(services.map(service => 
      service.id === serviceId ? { ...service, active: !service.active } : service
    ));
  };

  const handleManageWindows = (serviceId: number) => {
    setCurrentServiceId(serviceId);
    setShowWindowManager(true);
  };

  const currentFormData = editingService || newService;

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
                    checked={currentFormData.isSecret}
                    onCheckedChange={(checked) => editingService
                      ? setEditingService({...editingService, isSecret: checked})
                      : setNewService({...newService, isSecret: checked})
                    }
                  />
                  <Label htmlFor="secret">Secret Service</Label>
                  {currentFormData.isSecret && (
                    <Badge variant="secondary" className="text-xs">
                      {currentFormData.secretSlug || 'auto-generated'}
                    </Badge>
                  )}
                </div>
              </div>
              
              <RichTextEditor
                value={currentFormData.description}
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
                selectedTagIds={currentFormData.tagIds}
                onTagsChange={(tagIds) => editingService
                  ? setEditingService({...editingService, tagIds})
                  : setNewService({...newService, tagIds})
                }
              />

              {/* Enhanced Image Upload */}
              <MediaUpload
                imageUrl={currentFormData.imageUrl}
                onImageChange={(url) => editingService
                  ? setEditingService({...editingService, imageUrl: url})
                  : setNewService({...newService, imageUrl: url})
                }
                onRemove={() => editingService
                  ? setEditingService({...editingService, imageUrl: ""})
                  : setNewService({...newService, imageUrl: ""})
                }
              />

              {/* Guest and Time Controls */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="minGuests">Min Guests</Label>
                  <Select 
                    value={currentFormData.minGuests.toString()} 
                    onValueChange={(value) => editingService
                      ? setEditingService({...editingService, minGuests: parseInt(value)})
                      : setNewService({...newService, minGuests: parseInt(value)})
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
                    value={currentFormData.maxGuests.toString()} 
                    onValueChange={(value) => editingService
                      ? setEditingService({...editingService, maxGuests: parseInt(value)})
                      : setNewService({...newService, maxGuests: parseInt(value)})
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
                    value={currentFormData.leadTimeHours.toString()} 
                    onValueChange={(value) => editingService
                      ? setEditingService({...editingService, leadTimeHours: parseInt(value)})
                      : setNewService({...newService, leadTimeHours: parseInt(value)})
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
                    value={currentFormData.cancellationWindowHours.toString()} 
                    onValueChange={(value) => editingService
                      ? setEditingService({...editingService, cancellationWindowHours: parseInt(value)})
                      : setNewService({...newService, cancellationWindowHours: parseInt(value)})
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
                    checked={currentFormData.requiresDeposit}
                    onCheckedChange={(checked) => editingService
                      ? setEditingService({...editingService, requiresDeposit: checked})
                      : setNewService({...newService, requiresDeposit: checked})
                    }
                  />
                  <Label htmlFor="deposit">Requires Deposit</Label>
                </div>
                {currentFormData.requiresDeposit && (
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="depositAmount">Amount per guest (£)</Label>
                    <Input
                      id="depositAmount"
                      type="number"
                      className="w-20"
                      value={currentFormData.depositPerGuest}
                      onChange={(e) => editingService
                        ? setEditingService({...editingService, depositPerGuest: parseInt(e.target.value)})
                        : setNewService({...newService, depositPerGuest: parseInt(e.target.value)})
                      }
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bookable"
                    checked={currentFormData.onlineBookable}
                    onCheckedChange={(checked) => editingService
                      ? setEditingService({...editingService, onlineBookable: checked})
                      : setNewService({...newService, onlineBookable: checked})
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
                rules={currentFormData.durationRules}
                maxGuests={currentFormData.maxGuests}
                onChange={(rules) => editingService
                  ? setEditingService({...editingService, durationRules: rules})
                  : setNewService({...newService, durationRules: rules})
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
                            termsAndConditions: checked ? getStandardTerms() : editingService.termsAndConditions
                          })
                        : setNewService({
                            ...newService, 
                            useStandardTerms: checked,
                            termsAndConditions: checked ? getStandardTerms() : newService.termsAndConditions
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
                    value={currentFormData.termsAndConditions}
                    onChange={(value) => editingService
                      ? setEditingService({...editingService, termsAndConditions: value})
                      : setNewService({...newService, termsAndConditions: value})
                    }
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={editingService ? handleUpdateService : handleAddService}>
              {editingService ? 'Update Service' : 'Add Service'}
            </Button>
            <Button variant="outline" onClick={() => setShowServiceDialog(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Window Manager */}
      {currentServiceId && (
        <BookingWindowManager
          serviceId={currentServiceId.toString()}
          open={showWindowManager}
          onOpenChange={(open) => {
            setShowWindowManager(open);
            if (!open) setCurrentServiceId(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const serviceTags = getTagsForService(service.tagIds);
          const serviceWindows = getWindowsForService(service.id);
          
          return (
            <Card key={service.id} className={`overflow-hidden ${!service.active ? 'opacity-75' : ''}`}>
              <div className="aspect-video bg-muted bg-cover bg-center" 
                   style={{ backgroundImage: `url(${service.imageUrl})` }} />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 mb-2">
                      {service.title}
                      {service.isSecret && (
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
                    {service.onlineBookable && (
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
                    <span>{service.minGuests}-{service.maxGuests} guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                    <span>{service.leadTimeHours}h lead</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                    <span>{service.cancellationWindowHours}h cancel</span>
                  </div>
                  {service.requiresDeposit && (
                    <div className="text-sm font-medium">
                      £{service.depositPerGuest} deposit
                    </div>
                  )}
                </div>

                {/* Collapsible Duration Rules */}
                {service.durationRules?.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded bg-muted/50 hover:bg-muted text-sm">
                      <span className="font-medium">{service.durationRules.length} Duration Rules</span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-2">
                      {service.durationRules.map((rule, index) => (
                        <div key={rule.id || index} className="text-xs bg-muted p-2 rounded">
                          {rule.minGuests}-{rule.maxGuests} guests: {rule.durationMinutes} minutes
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Enhanced Booking Windows Display */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">Booking Windows</Label>
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
                              {window.start_date && format(window.start_date, 'MMM d, yyyy')}
                              {window.end_date && ` - ${format(window.end_date, 'MMM d, yyyy')}`}
                              {!window.end_date && window.start_date && " (ongoing)"}
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
