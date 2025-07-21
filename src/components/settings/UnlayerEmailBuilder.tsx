import React, { useRef, useCallback } from 'react';
import EmailEditor, { EditorRef, EmailEditorProps } from 'react-email-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UnlayerEmailBuilderProps {
  initialHtml?: string;
  initialDesign?: any;
  availableVariables?: { [key: string]: string };
  onSave?: (html: string, design: any) => void;
  onCancel?: () => void;
}

export const UnlayerEmailBuilder: React.FC<UnlayerEmailBuilderProps> = ({
  initialHtml = '',
  initialDesign = null,
  availableVariables = {},
  onSave,
  onCancel,
}) => {
  const emailEditorRef = useRef<EditorRef>(null);

  const onReady = useCallback(() => {
    console.log('Unlayer editor is ready');
    
    // Load initial design if provided
    if (initialDesign && emailEditorRef.current) {
      emailEditorRef.current.editor?.loadDesign(initialDesign);
    }
  }, [initialDesign]);

  const handleSave = useCallback(() => {
    if (!emailEditorRef.current) {
      console.error('Email editor ref not available');
      return;
    }

    emailEditorRef.current.editor?.exportHtml((data) => {
      const { design, html } = data;
      console.log('Exported design:', design);
      console.log('Exported HTML:', html);
      
      if (onSave) {
        onSave(html, design);
      }
    });
  }, [onSave]);

  const handlePreview = useCallback(() => {
    if (!emailEditorRef.current) {
      console.error('Email editor ref not available');
      return;
    }

    emailEditorRef.current.editor?.exportHtml((data) => {
      const { html } = data;
      // Open preview in new tab
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(html);
        previewWindow.document.close();
      }
    });
  }, []);

  // Unlayer configuration
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
      stockImages: false, // Disable stock images to avoid API key requirements
    },
    tools: {
      // Configure available tools
      text: { enabled: true },
      image: { enabled: true },
      button: { enabled: true },
      divider: { enabled: true },
      spacer: { enabled: true },
      menu: { enabled: true },
      social: { enabled: true },
      footer: { enabled: true },
      timer: { enabled: false }, // Disable premium features
      video: { enabled: false }, // Disable premium features
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

  return (
    <div className="flex flex-col h-full">
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Email Template Builder</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePreview}>
                Preview
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Template
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="flex-1">
        <CardContent className="p-0 h-full">
          <div className="h-full min-h-[600px]">
            <EmailEditor
              ref={emailEditorRef}
              onReady={onReady}
              options={editorOptions}
              style={{
                height: '100%',
                minHeight: '600px'
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Available Variables Info */}
      {Object.keys(availableVariables).length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Available Variables</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1">
              {Object.entries(availableVariables).map(([key, description]) => (
                <code key={key} className="text-xs bg-muted px-2 py-1 rounded">
                  {`{{${key}}}`} - {description}
                </code>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UnlayerEmailBuilder;