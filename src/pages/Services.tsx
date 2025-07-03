import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, Clock, Users, Edit, Trash2, Copy, Eye } from "lucide-react";
import { DurationRulesManager } from "@/components/services/DurationRulesManager";
import { MediaUpload } from "@/components/services/MediaUpload";
import { TermsEditor } from "@/components/services/TermsEditor";
import { RichTextEditor } from "@/components/services/RichTextEditor";
import { TagSelector } from "@/components/services/TagSelector";
import { DurationRule } from "@/hooks/useServiceDurationRules";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      ] as DurationRule[],
      windows: [
        { 
          id: 1,
          days: ["tue", "wed", "thu", "fri", "sat"], 
          startTime: "18:00", 
          endTime: "21:30",
          maxBookingsPerSlot: 10
        }
      ]
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
      ] as DurationRule[],
      windows: [
        { 
          id: 2,
          days: ["sat", "sun"], 
          startTime: "14:00", 
          endTime: "16:30",
          maxBookingsPerSlot: 6
        }
      ]
    }
  ]);

  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [showWindowDialog, setShowWindowDialog] = useState(false);
  const [editingWindow, setEditingWindow] = useState<any>(null);
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

  const [newWindow, setNewWindow] = useState({
    days: [] as string[],
    startTime: "",
    endTime: "",
    maxBookingsPerSlot: 10
  });

  const dayOptions = [
    { value: "mon", label: "Monday" },
    { value: "tue", label: "Tuesday" },
    { value: "wed", label: "Wednesday" },
    { value: "thu", label: "Thursday" },
    { value: "fri", label: "Friday" },
    { value: "sat", label: "Saturday" },
    { value: "sun", label: "Sunday" }
  ];

  const timeSlots = [
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
    "22:00", "22:30", "23:00", "23:30"
  ];

  // Helper function to get tags for a service
  const getTagsForService = (tagIds: string[]) => {
    return allTags.filter(tag => tagIds.includes(tag.id));
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
      secretSlug: newService.isSecret ? generateSecretSlug() : null,
      windows: []
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

  const handleAddWindow = () => {
    const window = {
      id: Date.now(),
      ...newWindow
    };
    
    setServices(services.map(service => 
      service.id === currentServiceId 
        ? { ...service, windows: [...service.windows, window] }
        : service
    ));
    
    resetWindowForm();
    setShowWindowDialog(false);
  };

  const handleUpdateWindow = () => {
    setServices(services.map(service => 
      service.id === currentServiceId 
        ? { 
            ...service, 
            windows: service.windows.map(w => w.id === editingWindow.id ? editingWindow : w)
          }
        : service
    ));
    
    setEditingWindow(null);
    setShowWindowDialog(false);
  };

  const handleDeleteWindow = (serviceId: number, windowId: number) => {
    setServices(services.map(service => 
      service.id === serviceId 
        ? { ...service, windows: service.windows.filter(w => w.id !== windowId) }
        : service
    ));
  };

  const handleEditWindow = (serviceId: number, window: any) => {
    setCurrentServiceId(serviceId);
    setEditingWindow(window);
    setShowWindowDialog(true);
  };

  const resetWindowForm = () => {
    setNewWindow({
      days: [],
      startTime: "",
      endTime: "",
      maxBookingsPerSlot: 10
    });
    setEditingWindow(null);
    setCurrentServiceId(null);
  };

  const toggleServiceActive = (serviceId: number) => {
    setServices(services.map(service => 
      service.id === serviceId ? { ...service, active: !service.active } : service
    ));
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    const currentData = editingWindow || newWindow;
    const setter = editingWindow ? setEditingWindow : setNewWindow;
    
    if (checked) {
      setter({ ...currentData, days: [...currentData.days, day] });
    } else {
      setter({ ...currentData, days: currentData.days.filter(d => d !== day) });
    }
  };

  const currentFormData = editingService || newService;
  const currentWindowData = editingWindow || newWindow;

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

      {/* Window Dialog */}
      <Dialog open={showWindowDialog} onOpenChange={(open) => {
        setShowWindowDialog(open);
        if (!open) resetWindowForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWindow ? 'Edit Booking Window' : 'Add Booking Window'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Days of Week</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {dayOptions.map(day => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={currentWindowData.days.includes(day.value)}
                      onCheckedChange={(checked) => handleDayToggle(day.value, !!checked)}
                    />
                    <Label htmlFor={`day-${day.value}`} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Select 
                  value={currentWindowData.startTime} 
                  onValueChange={(value) => editingWindow
                    ? setEditingWindow({...editingWindow, startTime: value})
                    : setNewWindow({...newWindow, startTime: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Select 
                  value={currentWindowData.endTime} 
                  onValueChange={(value) => editingWindow
                    ? setEditingWindow({...editingWindow, endTime: value})
                    : setNewWindow({...newWindow, endTime: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="maxBookings">Max Bookings Per Slot</Label>
              <Input
                id="maxBookings"
                type="number"
                value={currentWindowData.maxBookingsPerSlot}
                onChange={(e) => editingWindow
                  ? setEditingWindow({...editingWindow, maxBookingsPerSlot: parseInt(e.target.value)})
                  : setNewWindow({...newWindow, maxBookingsPerSlot: parseInt(e.target.value)})
                }
                min="1"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={editingWindow ? handleUpdateWindow : handleAddWindow}
                disabled={!currentWindowData.startTime || !currentWindowData.endTime || currentWindowData.days.length === 0}
              >
                {editingWindow ? 'Update Window' : 'Add Window'}
              </Button>
              <Button variant="outline" onClick={() => setShowWindowDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const serviceTags = getTagsForService(service.tagIds);
          
          return (
            <Card key={service.id} className={`overflow-hidden ${!service.active ? 'opacity-75' : ''}`}>
              <div className="aspect-video bg-muted bg-cover bg-center" 
                   style={{ backgroundImage: `url(${service.imageUrl})` }} />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {service.title}
                    {service.isSecret && (
                      <Badge variant="outline" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Secret
                      </Badge>
                    )}
                  </CardTitle>
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
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {serviceTags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                    <span>{service.minGuests}-{service.maxGuests} guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                    <span>{service.leadTimeHours}h lead time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                    <span>{service.cancellationWindowHours}h cancel</span>
                  </div>
                  {service.requiresDeposit && (
                    <div className="text-sm">
                      <span className="font-medium">£{service.depositPerGuest}</span> deposit
                    </div>
                  )}
                </div>

                {/* Duration Rules Display */}
                {service.durationRules?.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Duration Rules</Label>
                    <div className="space-y-1 max-h-16 overflow-y-auto">
                      {service.durationRules.map((rule, index) => (
                        <div key={rule.id || index} className="text-xs bg-muted p-1 rounded">
                          {rule.minGuests}-{rule.maxGuests} guests: {rule.durationMinutes}min
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking Windows */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">Booking Windows</Label>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setCurrentServiceId(service.id);
                        setShowWindowDialog(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {service.windows.map((window) => (
                      <div key={window.id} className="flex items-center justify-between text-xs bg-muted p-2 rounded">
                        <div>
                          <div>{window.days.join(", ")} • {window.startTime}-{window.endTime}</div>
                          <div className="text-muted-foreground">Max {window.maxBookingsPerSlot} bookings</div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditWindow(service.id, window)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteWindow(service.id, window.id)}
                            className="h-6 w-6 p-0 text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteService(service.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
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
