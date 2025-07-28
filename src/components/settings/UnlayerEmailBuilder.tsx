
import React, { useRef, useCallback } from 'react';
import EmailEditor, { EditorRef, EmailEditorProps } from 'react-email-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface UnlayerEmailBuilderProps {
  initialHtml?: string;
  initialDesign?: any;
  availableVariables?: { [key: string]: string };
  onSave?: (html: string, design: any) => void;
  onCancel?: () => void;
  fullScreen?: boolean;
}

export const UnlayerEmailBuilder: React.FC<UnlayerEmailBuilderProps> = ({
  initialHtml = '',
  initialDesign = null,
  availableVariables = {},
  onSave,
  onCancel,
  fullScreen = true,
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

  const containerClass = fullScreen 
    ? "fixed inset-0 z-50 bg-background flex flex-col" 
    : "flex flex-col h-full";

  const editorHeight = fullScreen ? "calc(100vh - 120px)" : "600px";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-semibold">Email Template Builder</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview}>
              Preview
            </Button>
            <Button variant="outline" onClick={onCancel}>
              {fullScreen ? <X className="h-4 w-4 mr-2" /> : null}
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Template
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <EmailEditor
          ref={emailEditorRef}
          onReady={onReady}
          options={editorOptions}
          style={{
            height: editorHeight,
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
    </div>
  );
};

export default UnlayerEmailBuilder;
