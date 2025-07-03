
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, Clock, Users, Edit, Trash2, Copy } from "lucide-react";

const Services = () => {
  const [services, setServices] = useState([
    {
      id: 1,
      title: "Dinner Service",
      description: "Evening dining experience with seasonal menu",
      image: "/api/placeholder/400/200",
      tags: ["dinner", "seasonal"],
      minGuests: 1,
      maxGuests: 8,
      leadTimeHours: 2,
      turnTimeMinutes: 120,
      requiresDeposit: true,
      depositPerGuest: 25,
      onlineBookable: true,
      active: true,
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
      image: "/api/placeholder/400/200",
      tags: ["tea", "traditional"],
      minGuests: 2,
      maxGuests: 6,
      leadTimeHours: 24,
      turnTimeMinutes: 90,
      requiresDeposit: false,
      depositPerGuest: 0,
      onlineBookable: true,
      active: true,
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
  const [editingService, setEditingService] = useState(null);
  const [showWindowDialog, setShowWindowDialog] = useState(false);
  const [editingWindow, setEditingWindow] = useState(null);
  const [currentServiceId, setCurrentServiceId] = useState(null);

  const [newService, setNewService] = useState({
    title: "",
    description: "",
    image: "",
    tags: "",
    minGuests: 1,
    maxGuests: 8,
    leadTimeHours: 2,
    turnTimeMinutes: 120,
    requiresDeposit: false,
    depositPerGuest: 0,
    onlineBookable: true,
    active: true
  });

  const [newWindow, setNewWindow] = useState({
    days: [],
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

  const handleAddService = () => {
    const service = {
      id: Date.now(),
      ...newService,
      tags: newService.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
      windows: []
    };
    setServices([...services, service]);
    resetServiceForm();
    setShowServiceDialog(false);
  };

  const handleUpdateService = () => {
    const updatedService = {
      ...editingService,
      tags: typeof editingService.tags === 'string' 
        ? editingService.tags.split(",").map(tag => tag.trim()).filter(tag => tag)
        : editingService.tags
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
      tags: Array.isArray(service.tags) ? service.tags.join(", ") : service.tags
    });
    setShowServiceDialog(true);
  };

  const handleDuplicateService = (service: any) => {
    const duplicatedService = {
      ...service,
      id: Date.now(),
      title: `${service.title} (Copy)`,
      active: false
    };
    setServices([...services, duplicatedService]);
  };

  const resetServiceForm = () => {
    setNewService({
      title: "",
      description: "",
      image: "",
      tags: "",
      minGuests: 1,
      maxGuests: 8,
      leadTimeHours: 2,
      turnTimeMinutes: 120,
      requiresDeposit: false,
      depositPerGuest: 0,
      onlineBookable: true,
      active: true
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

      {/* Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={(open) => {
        setShowServiceDialog(open);
        if (!open) resetServiceForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          </DialogHeader>
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
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={currentFormData.image}
                  onChange={(e) => editingService
                    ? setEditingService({...editingService, image: e.target.value})
                    : setNewService({...newService, image: e.target.value})
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={currentFormData.description}
                onChange={(e) => editingService
                  ? setEditingService({...editingService, description: e.target.value})
                  : setNewService({...newService, description: e.target.value})
                }
                placeholder="Describe your service..."
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={currentFormData.tags}
                onChange={(e) => editingService
                  ? setEditingService({...editingService, tags: e.target.value})
                  : setNewService({...newService, tags: e.target.value})
                }
                placeholder="dinner, seasonal, special"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="minGuests">Min Guests</Label>
                <Input
                  id="minGuests"
                  type="number"
                  value={currentFormData.minGuests}
                  onChange={(e) => editingService
                    ? setEditingService({...editingService, minGuests: parseInt(e.target.value)})
                    : setNewService({...newService, minGuests: parseInt(e.target.value)})
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxGuests">Max Guests</Label>
                <Input
                  id="maxGuests"
                  type="number"
                  value={currentFormData.maxGuests}
                  onChange={(e) => editingService
                    ? setEditingService({...editingService, maxGuests: parseInt(e.target.value)})
                    : setNewService({...newService, maxGuests: parseInt(e.target.value)})
                  }
                />
              </div>
              <div>
                <Label htmlFor="leadTime">Lead Time (hrs)</Label>
                <Input
                  id="leadTime"
                  type="number"
                  value={currentFormData.leadTimeHours}
                  onChange={(e) => editingService
                    ? setEditingService({...editingService, leadTimeHours: parseInt(e.target.value)})
                    : setNewService({...newService, leadTimeHours: parseInt(e.target.value)})
                  }
                />
              </div>
              <div>
                <Label htmlFor="turnTime">Turn Time (min)</Label>
                <Input
                  id="turnTime"
                  type="number"
                  value={currentFormData.turnTimeMinutes}
                  onChange={(e) => editingService
                    ? setEditingService({...editingService, turnTimeMinutes: parseInt(e.target.value)})
                    : setNewService({...newService, turnTimeMinutes: parseInt(e.target.value)})
                  }
                />
              </div>
            </div>

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

            <div className="flex gap-2">
              <Button onClick={editingService ? handleUpdateService : handleAddService}>
                {editingService ? 'Update Service' : 'Add Service'}
              </Button>
              <Button variant="outline" onClick={() => setShowServiceDialog(false)}>Cancel</Button>
            </div>
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
        {services.map((service) => (
          <Card key={service.id} className={`overflow-hidden ${!service.active ? 'opacity-75' : ''}`}>
            <div className="aspect-video bg-muted bg-cover bg-center" 
                 style={{ backgroundImage: `url(${service.image})` }} />
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{service.title}</CardTitle>
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
                {service.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
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
                  <span>{service.turnTimeMinutes}min duration</span>
                </div>
                {service.requiresDeposit && (
                  <div className="text-sm">
                    <span className="font-medium">£{service.depositPerGuest}</span> deposit
                  </div>
                )}
              </div>

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
        ))}
      </div>
    </div>
  );
};

export default Services;
