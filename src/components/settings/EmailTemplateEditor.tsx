import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Plus, Trash2, Save, X } from "lucide-react";
import { useEmailTemplates, EmailTemplate, EmailTemplateCreate, EmailTemplateUpdate } from "@/hooks/useEmailTemplates";
import { emailTemplateService } from "@/services/emailTemplateService";

interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  onSave?: () => void;
  onCancel?: () => void;
}

export function EmailTemplateEditor({ template, onSave, onCancel }: EmailTemplateEditorProps) {
  const { createTemplate, updateTemplate } = useEmailTemplates();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    template_key: template?.template_key || '',
    template_type: template?.template_type || 'venue',
    subject: template?.subject || '',
    html_content: template?.html_content || '',
    text_content: template?.text_content || '',
  });

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (template) {
        // Update existing template
        const updates: EmailTemplateUpdate = {
          subject: formData.subject,
          html_content: formData.html_content,
          text_content: formData.text_content || undefined,
        };
        await updateTemplate(template.id, updates);
      } else {
        // Create new template
        const newTemplate: EmailTemplateCreate = {
          template_key: formData.template_key,
          template_type: formData.template_type,
          subject: formData.subject,
          html_content: formData.html_content,
          text_content: formData.text_content || undefined,
        };
        await createTemplate(newTemplate);
      }
      
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="template_key">Template Key</Label>
          <Input
            id="template_key"
            value={formData.template_key}
            onChange={(e) => setFormData({ ...formData, template_key: e.target.value })}
            placeholder="booking_confirmation"
            disabled={!!template} // Don't allow editing key for existing templates
          />
        </div>
        <div>
          <Label htmlFor="template_type">Template Type</Label>
          <Input
            id="template_type"
            value={formData.template_type}
            onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
            placeholder="venue"
            disabled={!!template}
          />
        </div>
      </div>

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
  const { templates, isLoading, deleteTemplate, createDefaultTemplates } = useEmailTemplates();
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleDelete = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(templateId);
    }
  };

  const venueTemplates = templates.filter(t => t.venue_id);
  const platformTemplates = templates.filter(t => !t.venue_id);

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Email Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage your venue's email templates for bookings and communications
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createDefaultTemplates} variant="outline">
            Create Default Templates
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Email Template</DialogTitle>
                <DialogDescription>
                  Create a new email template for your venue
                </DialogDescription>
              </DialogHeader>
              <EmailTemplateEditor
                onSave={() => setIsCreateDialogOpen(false)}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {venueTemplates.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Venue Templates</h4>
          <div className="grid gap-4">
            {venueTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{template.template_key}</CardTitle>
                      <CardDescription className="text-sm">
                        {template.subject}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
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
                              <strong>Subject:</strong> {emailTemplateService.previewTemplate(template.subject)}
                            </div>
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: emailTemplateService.previewTemplate(template.html_content) 
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
                              Edit the email template for {template.template_key}
                            </DialogDescription>
                          </DialogHeader>
                          <EmailTemplateEditor
                            template={template}
                            onSave={() => {}}
                            onCancel={() => {}}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {platformTemplates.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Platform Templates</h4>
          <div className="grid gap-4">
            {platformTemplates.map((template) => (
              <Card key={template.id} className="opacity-75">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{template.template_key}</CardTitle>
                      <CardDescription className="text-sm">
                        {template.subject}
                      </CardDescription>
                      <Badge variant="secondary" className="w-fit mt-2">Platform Template</Badge>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Preview Platform Template</DialogTitle>
                        </DialogHeader>
                        <div className="border rounded-lg p-4 bg-white">
                          <div className="mb-4 p-2 bg-muted rounded text-sm">
                            <strong>Subject:</strong> {emailTemplateService.previewTemplate(template.subject)}
                          </div>
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: emailTemplateService.previewTemplate(template.html_content) 
                            }}
                            className="prose max-w-none"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">No email templates found</p>
            <Button onClick={createDefaultTemplates}>
              Create Default Templates
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}