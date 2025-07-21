
import React, { useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import EmailEditor, { EditorRef, EmailEditorProps } from 'react-email-editor';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Eye, Save } from 'lucide-react';

interface FullScreenEmailBuilderProps {
  isOpen: boolean;
  initialHtml?: string;
  initialDesign?: any;
  availableVariables?: { [key: string]: string };
  onSave?: (html: string, design: any) => void;
  onCancel?: () => void;
}

interface PreviewModalProps {
  isOpen: boolean;
  html: string;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, html, onClose }) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Email Preview</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-auto max-h-[70vh] p-4">
          <div 
            dangerouslySetInnerHTML={{ __html: html }}
            className="prose max-w-none"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const FullScreenEmailBuilder: React.FC<FullScreenEmailBuilderProps> = ({
  isOpen,
  initialHtml = '',
  initialDesign = null,
  availableVariables = {},
  onSave,
  onCancel,
}) => {
  const emailEditorRef = useRef<EditorRef>(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewHtml, setPreviewHtml] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [editorReady, setEditorReady] = React.useState(false);

  const onReady = useCallback(() => {
    console.log('Unlayer editor is ready');
    setEditorReady(true);
    
    if (emailEditorRef.current) {
      // If we have a design JSON, load it
      if (initialDesign) {
        emailEditorRef.current.editor?.loadDesign(initialDesign);
      } else if (initialHtml && initialHtml.trim()) {
        // If we only have HTML, try to load it or create a basic design with HTML
        try {
          // Create a basic design structure with the HTML content
          const basicDesign = {
            body: {
              rows: [
                {
                  columns: [
                    {
                      contents: [
                        {
                          type: 'html',
                          values: {
                            html: initialHtml
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          };
          emailEditorRef.current.editor?.loadDesign(basicDesign);
        } catch (error) {
          console.error('Error loading HTML into editor:', error);
        }
      }
    }
  }, [initialDesign, initialHtml]);

  const handleSave = useCallback(() => {
    if (!emailEditorRef.current) {
      console.error('Email editor ref not available');
      return;
    }

    setIsLoading(true);
    emailEditorRef.current.editor?.exportHtml((data) => {
      const { design, html } = data;
      console.log('Exported design:', design);
      console.log('Exported HTML:', html);
      
      if (onSave) {
        onSave(html, design);
      }
      setIsLoading(false);
    });
  }, [onSave]);

  const handlePreview = useCallback(() => {
    if (!emailEditorRef.current) {
      console.error('Email editor ref not available');
      return;
    }

    emailEditorRef.current.editor?.exportHtml((data) => {
      const { html } = data;
      setPreviewHtml(html);
      setShowPreview(true);
    });
  }, []);

  // Handle click outside to close - only on the backdrop
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel?.();
    }
  }, [onCancel]);

  // Prevent all events from propagating up from the editor container
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCancel]);

  const editorOptions: EmailEditorProps['options'] = {
    appearance: {
      theme: 'modern_light',
      panels: {
        tools: {
          dock: 'left'
        }
      }
    },
    features: {
      preview: true,
      imageEditor: true,
      stockImages: false,
    },
    tools: {
      text: { enabled: true },
      image: { enabled: true },
      button: { enabled: true },
      divider: { enabled: true },
      spacer: { enabled: true },
      menu: { enabled: true },
      social: { enabled: true },
      footer: { enabled: true },
      timer: { enabled: false },
      video: { enabled: false },
    },
    mergeTags: Object.keys(availableVariables).reduce((acc, key) => {
      acc[key] = {
        name: availableVariables[key],
        value: `{{${key}}}`,
        sample: availableVariables[key]
      };
      return acc;
    }, {} as any)
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-background w-full h-full flex flex-col"
        onClick={handleContainerClick}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b bg-background">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-semibold">Email Template Builder</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handlePreview} 
                disabled={isLoading || !editorReady}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isLoading || !editorReady}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden relative">
          {!editorReady && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Loading editor...</span>
              </div>
            </div>
          )}
          <EmailEditor
            ref={emailEditorRef}
            onReady={onReady}
            options={editorOptions}
            style={{
              height: 'calc(100vh - 120px)',
              width: '100%'
            }}
          />
        </div>

        {/* Available Variables Info */}
        {Object.keys(availableVariables).length > 0 && (
          <div className="flex-shrink-0 border-t bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Available Variables:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(availableVariables).map(([key, description]) => (
                <code key={key} className="text-xs bg-background px-2 py-1 rounded border">
                  {`{{${key}}}`} - {description}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* Preview Modal */}
        <PreviewModal 
          isOpen={showPreview}
          html={previewHtml}
          onClose={() => setShowPreview(false)}
        />
      </div>
    </div>,
    document.body
  );
};

export default FullScreenEmailBuilder;
