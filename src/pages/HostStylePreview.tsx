// Host-only theme — do not import outside /host routes

import React, { useState } from 'react';
import { HostLayout } from '@/components/layouts/HostLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { HOST_TOKENS } from '@/theme/host-tokens';
import { CheckCircle, AlertCircle, XCircle, Info, Copy, Download, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function HostStylePreview() {
  const [showTokens, setShowTokens] = useState(false);
  const [showExportTokens, setShowExportTokens] = useState(false);
  const { toast } = useToast();

  const AlertTypes = [
    { type: 'success', icon: CheckCircle, title: 'Success Alert', message: 'This is a success message' },
    { type: 'warning', icon: AlertCircle, title: 'Warning Alert', message: 'This is a warning message' },
    { type: 'danger', icon: XCircle, title: 'Error Alert', message: 'This is an error message' },
    { type: 'info', icon: Info, title: 'Info Alert', message: 'This is an informational message' },
  ];

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${label} copied successfully.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed", 
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const downloadTokens = async (filename: string) => {
    try {
      const response = await fetch(`/${filename}`);
      if (response.ok) {
        const data = await response.text();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download started",
          description: `${filename} is being downloaded.`,
        });
      } else {
        throw new Error('File not found');
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: `Could not download ${filename}. Run 'npm run build' to generate tokens.`,
        variant: "destructive",
      });
    }
  };

  return (
    <HostLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold host-text">Host Style Preview</h1>
            <p className="host-muted mt-2">Regression guard for Host interface styling</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowExportTokens(!showExportTokens)}
              variant="outline"
              className="host-border host-text"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Export Tokens
            </Button>
            <Button 
              onClick={() => setShowTokens(!showTokens)}
              variant="outline"
              className="host-border host-text"
            >
              {showTokens ? 'Hide' : 'Show'} Design Tokens
            </Button>
          </div>
        </div>

        {/* Export Tokens Panel */}
        {showExportTokens && (
          <Card className="host-card host-border">
            <CardHeader>
              <CardTitle className="host-text flex items-center gap-2">
                <Download className="h-5 w-5" />
                Design Token Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="host-muted text-sm">
                Export design tokens for design handover, documentation, or external design tools.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="host-card host-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="host-text text-lg">Complete Design Tokens</CardTitle>
                    <p className="host-muted text-sm">All colors, typography, layout, and spacing tokens</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => downloadTokens('host-design-tokens.json')}
                        size="sm"
                        variant="outline"
                        className="host-border host-text"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download JSON
                      </Button>
                      <Button
                        onClick={() => copyToClipboard(JSON.stringify(HOST_TOKENS, null, 2), 'Design tokens')}
                        size="sm"
                        variant="outline"
                        className="host-border host-text"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="host-card host-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="host-text text-lg">Typography Scale</CardTitle>
                    <p className="host-muted text-sm">Font sizes, weights, and line heights for all text elements</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => downloadTokens('host-typography-scale.json')}
                        size="sm"
                        variant="outline"
                        className="host-border host-text"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download JSON
                      </Button>
                      <Button
                        onClick={() => copyToClipboard(JSON.stringify(HOST_TOKENS.typography, null, 2), 'Typography scale')}
                        size="sm"
                        variant="outline"
                        className="host-border host-text"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert className="host-border">
                <Info className="h-4 w-4" />
                <AlertDescription className="host-text">
                  <strong>Usage:</strong> Import these tokens into Figma, Sketch, or other design tools. 
                  CSS custom properties are included for developer handover.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Design Tokens Panel */}
        {showTokens && (
          <Card className="host-card host-border">
            <CardHeader>
              <CardTitle className="host-text">Design Tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Colors */}
                <div>
                  <h4 className="font-semibold host-text mb-3">Colors</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(HOST_TOKENS.colors).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border cursor-pointer"
                          style={{ backgroundColor: value, borderColor: HOST_TOKENS.colors.border }}
                          onClick={() => copyToClipboard(value, `Color ${key}`)}
                          title="Click to copy"
                        />
                        <span className="host-muted">{key}:</span>
                        <span className="host-text font-mono text-xs">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typography */}
                <div>
                  <h4 className="font-semibold host-text mb-3">Typography</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="host-muted">Heading:</span>
                      <span className="host-text ml-2 font-mono text-xs">{HOST_TOKENS.typography.fontFamilies.heading}</span>
                    </div>
                    <div>
                      <span className="host-muted">Body:</span>
                      <span className="host-text ml-2 font-mono text-xs">{HOST_TOKENS.typography.fontFamilies.body}</span>
                    </div>
                    <div>
                      <span className="host-muted">Mono:</span>
                      <span className="host-text ml-2 font-mono text-xs">{HOST_TOKENS.typography.fontFamilies.mono}</span>
                    </div>
                  </div>
                </div>

                {/* Layout */}
                <div>
                  <h4 className="font-semibold host-text mb-3">Layout</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="host-muted">Sidebar Collapsed:</span>
                      <span className="host-text ml-2 font-mono text-xs">{HOST_TOKENS.layout.sidebarWidth.collapsed}</span>
                    </div>
                    <div>
                      <span className="host-muted">Sidebar Expanded:</span>
                      <span className="host-text ml-2 font-mono text-xs">{HOST_TOKENS.layout.sidebarWidth.expanded}</span>
                    </div>
                    <div>
                      <span className="host-muted">Container Padding:</span>
                      <span className="host-text ml-2 font-mono text-xs">{HOST_TOKENS.layout.containerPadding}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Typography Tests */}
        <Card className="host-card host-border">
          <CardHeader>
            <CardTitle className="host-text">Typography Scale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-4xl font-bold host-text" style={{ fontFamily: HOST_TOKENS.typography.fontFamilies.heading }}>
              H1 Heading - Playfair Display
            </h1>
            <h2 className="text-3xl font-semibold host-text">H2 Heading - Poppins</h2>
            <h3 className="text-2xl font-semibold host-text">H3 Heading - Poppins</h3>
            <h4 className="text-xl font-medium host-text">H4 Heading - Poppins</h4>
            <h5 className="text-lg font-medium host-text">H5 Heading - Poppins</h5>
            <h6 className="text-base font-medium host-text">H6 Heading - Poppins</h6>
            <p className="host-text" style={{ fontFamily: HOST_TOKENS.typography.fontFamilies.body }}>
              Body text using Karla font family. This is regular paragraph text that should be easily readable.
            </p>
            <p className="host-muted text-sm">Muted text for secondary information</p>
          </CardContent>
        </Card>

        {/* Component Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buttons */}
          <Card className="host-card host-border">
            <CardHeader>
              <CardTitle className="host-text">Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button>Primary Button</Button>
                <Button variant="outline" className="host-border host-text">Outline Button</Button>
                <Button variant="ghost" className="host-text">Ghost Button</Button>
                <Button variant="destructive">Destructive Button</Button>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card className="host-card host-border">
            <CardHeader>
              <CardTitle className="host-text">Form Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                placeholder="Sample input field" 
                className="host-border host-text"
                style={{ backgroundColor: HOST_TOKENS.colors.surface }}
              />
              <div className="flex flex-wrap gap-2">
                <Badge>Default Badge</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <Card className="host-card host-border">
          <CardHeader>
            <CardTitle className="host-text">Alert Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {AlertTypes.map(({ type, icon: Icon, title, message }) => (
              <Alert key={type} className="host-border">
                <Icon className="h-4 w-4" />
                <AlertDescription className="host-text">
                  <strong>{title}:</strong> {message}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>

        {/* Color Swatches */}
        <Card className="host-card host-border">
          <CardHeader>
            <CardTitle className="host-text">Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(HOST_TOKENS.colors).map(([name, value]) => (
                <div key={name} className="text-center">
                  <div 
                    className="w-full h-16 rounded-lg border mb-2 cursor-pointer transition-transform hover:scale-105"
                    style={{ backgroundColor: value, borderColor: HOST_TOKENS.colors.border }}
                    onClick={() => copyToClipboard(value, `Color ${name}`)}
                    title="Click to copy color value"
                  />
                  <p className="host-text text-sm font-medium">{name}</p>
                  <p className="host-muted text-xs font-mono">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regression Checklist */}
        <Card className="host-card host-border">
          <CardHeader>
            <CardTitle className="host-text">Regression Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="host-text">Background: host-blackest-dark (#111315)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="host-text">Cards: host-dark-gray (#292C2D)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="host-text">Text: White (#FFFFFF)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="host-text">Borders: host-mid-gray (#676767)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="host-text">Sidebar: Collapsed by default on iPad</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="host-text">Theme: Isolated from global changes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="host-text">Design tokens: Exportable and documented</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </HostLayout>
  );
}
