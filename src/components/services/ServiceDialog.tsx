
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DurationRulesManager } from "@/components/services/DurationRulesManager";
import { MediaUpload } from "@/components/services/MediaUpload";
import { TermsEditor } from "@/components/services/TermsEditor";
import { RichTextEditor } from "@/components/services/RichTextEditor";
import { TagSelector } from "@/components/services/TagSelector";

const guestOptions = Array.from({length: 20}, (_, i) => i + 1);
const leadTimeOptions = [1, 2, 4, 6, 12, 24, 48, 72];
const cancellationOptions = [24, 48, 72];

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingService: any;
  newService: any;
  setEditingService: (service: any) => void;
  setNewService: (service: any) => void;
  onAddService: () => void;
  onUpdateService: () => void;
  createServiceMutation: any;
  updateServiceMutation: any;
  onReset: () => void;
}

export const ServiceDialog = ({
  open,
  onOpenChange,
  editingService,
  newService,
  setEditingService,
  setNewService,
  onAddService,
  onUpdateService,
  createServiceMutation,
  updateServiceMutation,
  onReset
}: ServiceDialogProps) => {
  const currentFormData = editingService || newService;

  const getStandardTerms = () => {
    return localStorage.getItem('standardTerms') || '';
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) onReset();
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
            onClick={editingService ? onUpdateService : onAddService}
            disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
          >
            {createServiceMutation.isPending || updateServiceMutation.isPending 
              ? "Saving..." 
              : editingService ? 'Update Service' : 'Add Service'
            }
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
