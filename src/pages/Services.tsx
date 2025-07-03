
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, Users } from "lucide-react";

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
      windows: [
        { days: ["tue", "wed", "thu", "fri", "sat"], startTime: "18:00", endTime: "21:30" }
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
      windows: [
        { days: ["sat", "sun"], startTime: "14:00", endTime: "16:30" }
      ]
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
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
    onlineBookable: true
  });

  const handleAddService = () => {
    const service = {
      id: Date.now(),
      ...newService,
      tags: newService.tags.split(",").map(tag => tag.trim()),
      windows: [{ days: ["tue", "wed", "thu", "fri", "sat"], startTime: "18:00", endTime: "21:30" }]
    };
    setServices([...services, service]);
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
      onlineBookable: true
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground">Manage your restaurant services</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
          Add Service
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Service</CardTitle>
            <CardDescription>Create a new bookable service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Service Title</Label>
                <Input
                  id="title"
                  value={newService.title}
                  onChange={(e) => setNewService({...newService, title: e.target.value})}
                  placeholder="e.g., Dinner Service"
                />
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={newService.image}
                  onChange={(e) => setNewService({...newService, image: e.target.value})}
                  placeholder="https://..."
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newService.description}
                onChange={(e) => setNewService({...newService, description: e.target.value})}
                placeholder="Describe your service..."
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={newService.tags}
                onChange={(e) => setNewService({...newService, tags: e.target.value})}
                placeholder="dinner, seasonal, special"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="minGuests">Min Guests</Label>
                <Input
                  id="minGuests"
                  type="number"
                  value={newService.minGuests}
                  onChange={(e) => setNewService({...newService, minGuests: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="maxGuests">Max Guests</Label>
                <Input
                  id="maxGuests"
                  type="number"
                  value={newService.maxGuests}
                  onChange={(e) => setNewService({...newService, maxGuests: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="leadTime">Lead Time (hrs)</Label>
                <Input
                  id="leadTime"
                  type="number"
                  value={newService.leadTimeHours}
                  onChange={(e) => setNewService({...newService, leadTimeHours: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="turnTime">Turn Time (min)</Label>
                <Input
                  id="turnTime"
                  type="number"
                  value={newService.turnTimeMinutes}
                  onChange={(e) => setNewService({...newService, turnTimeMinutes: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="deposit"
                  checked={newService.requiresDeposit}
                  onCheckedChange={(checked) => setNewService({...newService, requiresDeposit: checked})}
                />
                <Label htmlFor="deposit">Requires Deposit</Label>
              </div>
              {newService.requiresDeposit && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="depositAmount">Amount per guest (£)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    className="w-20"
                    value={newService.depositPerGuest}
                    onChange={(e) => setNewService({...newService, depositPerGuest: parseInt(e.target.value)})}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="bookable"
                checked={newService.onlineBookable}
                onCheckedChange={(checked) => setNewService({...newService, onlineBookable: checked})}
              />
              <Label htmlFor="bookable">Online Bookable</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddService}>Add Service</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="overflow-hidden">
            <div className="aspect-video bg-muted bg-cover bg-center" 
                 style={{ backgroundImage: `url(${service.image})` }} />
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{service.title}</CardTitle>
                {service.onlineBookable && (
                  <Badge variant="secondary">Online</Badge>
                )}
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

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Available: {service.windows[0]?.days.join(", ")} 
                  {service.windows[0] && ` ${service.windows[0].startTime}-${service.windows[0].endTime}`}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Services;
