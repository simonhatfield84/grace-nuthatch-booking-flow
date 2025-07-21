
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GrapeJSEmailBuilderProps {
  initialHtml?: string;
  initialDesign?: any;
  onSave: (html: string, design: any) => void;
  onCancel: () => void;
  availableVariables: { [key: string]: string };
}

export function GrapeJSEmailBuilder({
  initialHtml = '',
  initialDesign,
  onSave,
  onCancel,
  availableVariables
}: GrapeJSEmailBuilderProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    const initializeEditor = async () => {
      console.log('Starting GrapeJS initialization...');
      try {
        if (!editorRef.current) {
          console.error('Editor container not found');
          return;
        }

        console.log('Loading GrapeJS modules...');
        // Dynamic import to avoid SSR issues
        const grapesjs = await import('grapesjs');
        const grapesjsNewsletter = await import('grapesjs-preset-newsletter');
        
        console.log('GrapeJS modules loaded successfully');

        // Import CSS for GrapeJS
        await import('grapesjs/dist/css/grapes.min.css');
        console.log('GrapeJS CSS loaded');

        console.log('Initializing GrapeJS editor...');
        const grapesEditor = grapesjs.default.init({
          container: editorRef.current,
          height: '600px',
          width: 'auto',
          plugins: [grapesjsNewsletter.default],
          pluginsOpts: {
            'grapesjs-preset-newsletter': {
              modalLabelImport: 'Import template',
              modalLabelExport: 'Export template',
              modalTitleImport: 'Import template',
              modalTitleExport: 'Export template',
              codeViewerTheme: 'material',
              importPlaceholder: 'Paste your HTML here',
              inlineCss: true,
              tableBasicCategory: 'Basic',
              cellsCategory: 'Table cells',
              classPrefix: 'gjs-',
            }
          },
          canvas: {
            styles: [
              'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
            ]
          },
          storageManager: false,
          assetManager: {
            assets: []
          },
          blockManager: {
            appendTo: '#blocks-container',
          },
          layerManager: {
            appendTo: '#layers-container',
          },
          deviceManager: {
            devices: [
              {
                name: 'Desktop',
                width: '100%',
              },
              {
                name: 'Mobile',
                width: '320px',
                widthMedia: '480px',
              }
            ]
          },
          panels: {
            defaults: [
              {
                id: 'layers',
                el: '#layers-container',
                resizable: {
                  maxDim: 350,
                  minDim: 200,
                  tc: false,
                  cl: true,
                  cr: false,
                  bc: false,
                },
              },
              {
                id: 'panel-switcher',
                el: '#panel-switcher',
                buttons: [
                  {
                    id: 'show-layers',
                    active: true,
                    label: 'Layers',
                    command: 'show-layers',
                    togglable: false,
                  },
                  {
                    id: 'show-style',
                    active: true,
                    label: 'Styles',
                    command: 'show-styles',
                    togglable: false,
                  }
                ],
              },
              {
                id: 'panel-devices',
                el: '#panel-devices',
                buttons: [
                  {
                    id: 'device-desktop',
                    label: '🖥️',
                    command: 'set-device-desktop',
                    active: true,
                    togglable: false,
                  },
                  {
                    id: 'device-mobile',
                    label: '📱',
                    command: 'set-device-mobile',
                    togglable: false,
                  }
                ],
              }
            ]
          }
        });

        // Add custom merge tag blocks
        Object.entries(availableVariables).forEach(([key, description]) => {
          grapesEditor.BlockManager.add(`merge-${key}`, {
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            content: `<span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #1f2937;">{{${key}}}</span>`,
            category: 'Merge Tags',
            attributes: { title: description }
          });
        });

        // Add booking details block
        grapesEditor.BlockManager.add('booking-details', {
          label: 'Booking Details',
          content: `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin-top: 0; color: #000000; font-family: Arial, sans-serif;">Booking Details</h3>
              <p style="margin: 8px 0;"><strong>Reference:</strong> <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{{booking_reference}}</span></p>
              <p style="margin: 8px 0;"><strong>Date:</strong> <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{{booking_date}}</span></p>
              <p style="margin: 8px 0;"><strong>Time:</strong> <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{{booking_time}}</span></p>
              <p style="margin: 8px 0;"><strong>Party Size:</strong> <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{{party_size}}</span></p>
              <p style="margin: 8px 0;"><strong>Venue:</strong> <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{{venue_name}}</span></p>
            </div>
          `,
          category: 'Email Components'
        });

        // Add action buttons block
        grapesEditor.BlockManager.add('action-buttons', {
          label: 'Action Buttons',
          content: `
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{modify_link}}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px; display: inline-block; font-family: Arial, sans-serif;">Modify Booking</a>
              <a href="{{cancel_link}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-family: Arial, sans-serif;">Cancel Booking</a>
            </div>
          `,
          category: 'Email Components'
        });

        // Commands
        grapesEditor.Commands.add('set-device-desktop', {
          run: () => grapesEditor.setDevice('Desktop')
        });
        grapesEditor.Commands.add('set-device-mobile', {
          run: () => grapesEditor.setDevice('Mobile')
        });
        grapesEditor.Commands.add('show-layers', {
          run: () => {
            const panel = grapesEditor.Panels.getPanel('layers');
            panel.set('appendContent', grapesEditor.LayerManager.render()).trigger('change:appendContent');
          }
        });
        grapesEditor.Commands.add('show-styles', {
          run: () => {
            const panel = grapesEditor.Panels.getPanel('layers');
            const container = document.createElement('div');
            const selectorRender = grapesEditor.SelectorManager.render([]);
            const styleRender = grapesEditor.StyleManager.render();
            if (selectorRender) container.appendChild(selectorRender);
            if (styleRender) container.appendChild(styleRender);
            panel.set('appendContent', container).trigger('change:appendContent');
          }
        });

        // Load initial content
        if (initialDesign) {
          grapesEditor.loadProjectData(initialDesign);
        } else if (initialHtml) {
          grapesEditor.setComponents(initialHtml);
        } else {
          // Load default template
          grapesEditor.setComponents(`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="text-align: center; margin-bottom: 30px; padding: 20px 0;">
                <h1 style="color: #000000; font-size: 28px; margin: 0; font-family: Arial, sans-serif;">{{venue_name}}</h1>
                <p style="color: #666666; margin: 10px 0 0 0; font-family: Arial, sans-serif;">Booking Confirmation</p>
              </div>
              
              <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px;">
                <h2 style="color: #1e293b; margin-top: 0; font-family: Arial, sans-serif;">Your booking is confirmed!</h2>
                <p style="font-family: Arial, sans-serif; line-height: 1.6;">Dear <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{{guest_name}}</span>,</p>
                <p style="font-family: Arial, sans-serif; line-height: 1.6;">Thank you for your booking at <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{{venue_name}}</span>.</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                  <h3 style="margin-top: 0; color: #000000; font-family: Arial, sans-serif;">Booking Details</h3>
                  <p style="margin: 8px 0; font-family: Arial, sans-serif;"><strong>Reference:</strong> <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{{booking_reference}}</span></p>
                  <p style="margin: 8px 0; font-family: Arial, sans-serif;"><strong>Date:</strong> <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{{booking_date}}</span></p>
                  <p style="margin: 8px 0; font-family: Arial, sans-serif;"><strong>Time:</strong> <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{{booking_time}}</span></p>
                  <p style="margin: 8px 0; font-family: Arial, sans-serif;"><strong>Party Size:</strong> <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{{party_size}}</span></p>
                  <p style="margin: 8px 0; font-family: Arial, sans-serif;"><strong>Venue:</strong> <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{{venue_name}}</span></p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{modify_link}}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px; display: inline-block; font-family: Arial, sans-serif;">Modify Booking</a>
                  <a href="{{cancel_link}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-family: Arial, sans-serif;">Cancel Booking</a>
                </div>
                
                <p style="font-family: Arial, sans-serif; line-height: 1.6;">We look forward to seeing you!</p>
              </div>
              
              <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px; padding: 20px;">
                <p style="font-family: Arial, sans-serif; margin: 0;"><span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{{email_signature}}</span></p>
                <p style="margin-top: 20px; font-size: 10px; color: #999; font-family: Arial, sans-serif;">Powered by Grace</p>
              </div>
            </div>
          `);
        }

        // Update preview on changes
        grapesEditor.on('component:update', () => {
          setPreviewHtml(grapesEditor.getHtml());
        });

        console.log('GrapeJS editor initialized successfully');
        setEditor(grapesEditor);
        setPreviewHtml(grapesEditor.getHtml());
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing GrapeJS:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          error
        });
        setIsLoading(false);
        // Set a fallback state to show error to user
        setPreviewHtml('<p>Error loading email builder. Please try refreshing the page.</p>');
      }
    };

    initializeEditor();

    return () => {
      if (editor) {
        try {
          console.log('Destroying GrapeJS editor...');
          editor.destroy();
        } catch (error) {
          console.error('Error destroying editor:', error);
        }
      }
    };
  }, []);

  const handleSave = () => {
    if (!editor) return;
    
    const html = editor.getHtml();
    const css = editor.getCss();
    const design = editor.getProjectData();
    
    // Combine HTML and CSS for the final email
    const finalHtml = `
      <style>
        ${css}
        /* Mobile-first responsive styles */
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .content { padding: 10px !important; }
          .button { display: block !important; margin: 10px 0 !important; }
        }
      </style>
      ${html}
    `;
    
    onSave(finalHtml, design);
  };

  const replaceVariablesForPreview = (html: string) => {
    const sampleData = {
      guest_name: "John Smith",
      venue_name: "The Nuthatch",
      booking_date: "Friday, December 25th, 2024",
      booking_time: "7:00 PM",
      booking_end_time: "9:00 PM",
      service: "Dinner",
      party_size: "4 guests",
      booking_reference: "BK-2024-123456",
      payment_status: "Paid",
      payment_amount: "$25.00",
      email_signature: "Best regards,\nThe Nuthatch Team",
      cancel_link: "#cancel",
      modify_link: "#modify",
    };

    let processedHtml = html;
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processedHtml = processedHtml.replace(regex, value);
    });
    
    return processedHtml;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading email builder...</p>
          <p className="text-sm text-muted-foreground mt-2">
            This may take a few moments...
          </p>
        </div>
      </div>
    );
  }

  // Show error state if there's no editor but we're not loading
  if (!editor && !isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg">⚠️</div>
          <div>
            <p className="font-medium">Failed to load email builder</p>
            <p className="text-sm text-muted-foreground mt-1">
              There was an issue loading the visual editor. Please check the console for details.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              size="sm"
            >
              Refresh Page
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-medium">Email Template Builder</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Template
          </Button>
        </div>
      </div>

      <Tabs defaultValue="builder" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="flex-1 flex">
          <div className="flex flex-1">
            {/* Sidebar */}
            <div className="w-64 border-r bg-muted/50 p-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Device Preview</h4>
                <div id="panel-devices" className="flex gap-2"></div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Components</h4>
                <div id="blocks-container" className="space-y-2"></div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Panels</h4>
                <div id="panel-switcher" className="flex gap-2"></div>
              </div>
            </div>

            {/* Main Editor */}
            <div className="flex-1 flex">
              <div ref={editorRef} className="flex-1"></div>
              
              {/* Properties Panel */}
              <div className="w-64 border-l bg-muted/50">
                <div id="layers-container" className="h-full"></div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="border rounded-lg p-4 bg-white">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: replaceVariablesForPreview(previewHtml) 
                }}
                className="prose max-w-none"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="variables" className="flex-1 p-4">
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
    </div>
  );
}
