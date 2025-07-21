
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit, Eye, Save, X, Clock } from "lucide-react";
import { useEmailTemplates, EmailTemplate, EmailTemplateUpdate } from "@/hooks/useEmailTemplates";
import { emailTemplateService } from "@/services/emailTemplateService";

interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  onSave?: () => void;
  onCancel?: () => void;
}

export function EmailTemplateEditor({ template, onSave, onCancel }: EmailTemplateEditorProps) {
  const { updateTemplate } = useEmailTemplates();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: template?.subject || '',
    html_content: template?.html_content || '',
    text_content: template?.text_content || '',
  });

  const handleSave = async () => {
    if (!template) return;
    
    try {
      setIsLoading(true);
      
      const updates: EmailTemplateUpdate = {
        subject: formData.subject,
        html_content: formData.html_content,
        text_content: formData.text_content || undefined,
      };
      await updateTemplate(template.id, updates);
      
      onSave?.();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const previewHtml = emailTemplateService.previewTemplate(formData.html_content);
  const availableVariables = emailTemplateService.getAvailableVariables();

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="subject">Subject Line</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Booking Confirmation - {{venue_name}}"
        />
      </div>

      <Tabs defaultValue="edit" className="w-full">
        <TabsList>
          <TabsTrigger value="edit">Edit HTML</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          <div>
            <Label htmlFor="html_content">HTML Content</Label>
            <Textarea
              id="html_content"
              value={formData.html_content}
              onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
              placeholder="Enter your HTML email template..."
              rows={15}
              className="font-mono text-sm"
            />
          </div>

          <div>
            <Label htmlFor="text_content">Plain Text Content (Optional)</Label>
            <Textarea
              id="text_content"
              value={formData.text_content}
              onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
              placeholder="Enter plain text version..."
              rows={8}
            />
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <div className="border rounded-lg p-4 bg-white">
            <div className="mb-4 p-2 bg-muted rounded text-sm">
              <strong>Subject:</strong> {emailTemplateService.previewTemplate(formData.subject)}
            </div>
            <div 
              dangerouslySetInnerHTML={{ __html: previewHtml }}
              className="prose max-w-none"
            />
          </div>
        </TabsContent>

        <TabsContent value="variables">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Available variables you can use in your templates:
            </p>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(availableVariables).map(([key, description]) => (
                <div key={key} className="flex flex-col space-y-2">
                  <Badge variant="outline" className="w-fit">
                    {`{{${key}}}`}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Template'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function EmailTemplatesList() {
  const { templates, isLoading, createDefaultTemplates, toggleTemplateActive, loadTemplates } = useEmailTemplates();
  const [hasInitialized, setHasInitialized] = useState(false);

  const predefinedTemplates = [
    { key: 'booking_confirmation', name: 'Booking Confirmation', description: 'Sent immediately after a booking is confirmed' },
    { key: 'booking_reminder_24h', name: '24-Hour Reminder', description: 'Sent 24 hours before the booking' },
    { key: 'booking_reminder_2h', name: '2-Hour Reminder', description: 'Sent 2 hours before the booking' },
    { key: 'booking_cancelled', name: 'Booking Cancelled', description: 'Sent when a booking is cancelled' },
    { key: 'booking_modified', name: 'Booking Modified', description: 'Sent when a booking is modified' },
    { key: 'booking_no_show', name: 'No-Show Follow-up', description: 'Sent when a booking is marked as no-show' },
    { key: 'walk_in_confirmation', name: 'Walk-in Confirmation', description: 'Sent when a walk-in visit is recorded' },
  ];

  // Auto-create default templates if none exist
  useEffect(() => {
    if (!isLoading && !hasInitialized && templates.length === 0) {
      setHasInitialized(true);
      createDefaultTemplates();
    }
  }, [isLoading, templates.length, hasInitialized, createDefaultTemplates]);

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Email Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage automated email communications for your venue
          </p>
        </div>
        <Button onClick={loadTemplates} variant="outline">
          Refresh Templates
        </Button>
      </div>

      <div className="grid gap-4">
        {predefinedTemplates.map((predefined) => {
          const existingTemplate = templates.find(t => t.template_key === predefined.key);
          
          return (
            <Card key={predefined.key}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base">{predefined.name}</CardTitle>
                      {existingTemplate ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={existingTemplate.is_active}
                            onCheckedChange={(checked) => toggleTemplateActive(existingTemplate.id, checked)}
                            className="scale-75"
                          />
                          <span className={`text-xs px-2 py-1 rounded ${existingTemplate.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {existingTemplate.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {existingTemplate.auto_send && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Auto-send
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Badge variant="secondary">Creating...</Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm mb-2">
                      {existingTemplate ? existingTemplate.subject : 'Template is being created...'}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground">
                      <strong>When sent:</strong> {predefined.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {existingTemplate ? (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Preview Template</DialogTitle>
                            </DialogHeader>
                            <div className="border rounded-lg p-4 bg-white">
                              <div className="mb-4 p-2 bg-muted rounded text-sm">
                                <strong>Subject:</strong> {emailTemplateService.previewTemplate(existingTemplate.subject)}
                              </div>
                              <div 
                                dangerouslySetInnerHTML={{ 
                                  __html: emailTemplateService.previewTemplate(existingTemplate.html_content) 
                                }}
                                className="prose max-w-none"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Email Template</DialogTitle>
                              <DialogDescription>
                                Edit the {predefined.name} email template
                              </DialogDescription>
                            </DialogHeader>
                            <EmailTemplateEditor
                              template={existingTemplate}
                              onSave={() => {
                                loadTemplates();
                              }}
                              onCancel={() => {}}
                            />
                          </DialogContent>
                        </Dialog>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={createDefaultTemplates}
                        disabled={isLoading}
                      >
                        Retry Creation
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
