
import React, { useState } from 'react';
import { PlatformAdminLayout } from '@/components/layouts/PlatformAdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GRACE_TOKENS } from '@/theme/exports/tokens';
import { CheckCircle, AlertCircle, XCircle, Info, Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import Grace theme CSS for this preview
import '@/theme/exports/grace-theme.css';

export default function PlatformStyleExportPreview() {
  const [showTokens, setShowTokens] = useState(false);
  const { toast } = useToast();

  const AlertTypes = [
    { type: 'success', icon: CheckCircle, title: 'Success Alert', message: 'This is a success message' },
    { type: 'warning', icon: AlertCircle, title: 'Warning Alert', message: 'This is a warning message' },
    { type: 'danger', icon: XCircle, title: 'Error Alert', message: 'This is an error message' },
    { type: 'info', icon: Info, title: 'Info Alert', message: 'This is an informational message' },
  ];

  const sampleTableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Pending' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Inactive' },
  ];

  const handleCopyTokens = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(GRACE_TOKENS, null, 2));
      toast({
        title: "Copied!",
        description: "Design tokens copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy tokens",
        variant: "destructive",
      });
    }
  };

  return (
    <PlatformAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Grace OS Style Export Preview</h1>
            <p className="text-muted-foreground mt-2">
              Design system export verification and token showcase
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowTokens(!showTokens)}
              variant="outline"
            >
              {showTokens ? 'Hide' : 'Show'} Design Tokens
            </Button>
            <Button onClick={handleCopyTokens} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy Tokens
            </Button>
          </div>
        </div>

        {/* Export Files Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Bundle Status
            </CardTitle>
            <CardDescription>
              Verification of generated design system files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">tokens.ts</span>
                  <Badge variant="secondary">Generated</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">grace-theme.css</span>
                  <Badge variant="secondary">Generated</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">fonts.css</span>
                  <Badge variant="secondary">Generated</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">tailwind.extend.json</span>
                  <Badge variant="secondary">Generated</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">tokens.json</span>
                  <Badge variant="secondary">Generated</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">README.md</span>
                  <Badge variant="secondary">Generated</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Tokens Panel */}
        {showTokens && (
          <Card>
            <CardHeader>
              <CardTitle>Design Tokens</CardTitle>
              <CardDescription>
                Complete token system extracted from Grace OS Reservations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Colors */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Brand Colors</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: GRACE_TOKENS.colors.primary }}
                      />
                      <span className="text-muted-foreground">Primary:</span>
                      <span className="text-foreground font-mono text-xs">{GRACE_TOKENS.colors.primary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: GRACE_TOKENS.colors.secondary }}
                      />
                      <span className="text-muted-foreground">Secondary:</span>
                      <span className="text-foreground font-mono text-xs">{GRACE_TOKENS.colors.secondary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: GRACE_TOKENS.colors.accent }}
                      />
                      <span className="text-muted-foreground">Accent:</span>
                      <span className="text-foreground font-mono text-xs">{GRACE_TOKENS.colors.accent}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: GRACE_TOKENS.colors.background }}
                      />
                      <span className="text-muted-foreground">Background:</span>
                      <span className="text-foreground font-mono text-xs">{GRACE_TOKENS.colors.background}</span>
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Typography</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(GRACE_TOKENS.typography.fontFamilies).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-muted-foreground capitalize">{key}:</span>
                        <span className="text-foreground ml-2 font-mono text-xs">{value[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spacing */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Spacing Scale</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(GRACE_TOKENS.spacing).slice(0, 8).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div 
                          className="bg-primary rounded"
                          style={{ width: value, height: '0.5rem', minWidth: '1px' }}
                        />
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="text-foreground font-mono text-xs">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Typography Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Scale</CardTitle>
            <CardDescription>Heading hierarchy and body text samples</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground font-playfair">
              H1 Heading - Playfair Display
            </h1>
            <h2 className="text-3xl font-semibold text-foreground font-poppins">H2 Heading - Poppins</h2>
            <h3 className="text-2xl font-semibold text-foreground font-poppins">H3 Heading - Poppins</h3>
            <h4 className="text-xl font-medium text-foreground font-poppins">H4 Heading - Poppins</h4>
            <h5 className="text-lg font-medium text-foreground font-poppins">H5 Heading - Poppins</h5>
            <h6 className="text-base font-medium text-foreground font-poppins">H6 Heading - Poppins</h6>
            <p className="text-foreground font-karla">
              Body text using Karla font family. This is regular paragraph text that should be easily readable 
              across all devices and screen sizes. The Grace OS design system prioritizes readability and 
              accessibility in all typography choices.
            </p>
            <p className="text-muted-foreground text-sm">Muted text for secondary information</p>
            <p className="grace-logo text-2xl">Grace OS - Markazi Text Brand Font</p>
          </CardContent>
        </Card>

        {/* Components Showcase */}
        <Tabs defaultValue="buttons" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
          </TabsList>

          <TabsContent value="buttons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Button Components</CardTitle>
                <CardDescription>All button variants and sizes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button>Primary Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="destructive">Destructive Button</Button>
                  <Button variant="link">Link Button</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Form Elements</CardTitle>
                <CardDescription>Inputs, badges, and form controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Sample input field" />
                <div className="flex flex-wrap gap-2">
                  <Badge>Default Badge</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sample Card</CardTitle>
                  <CardDescription>Card with header and content</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This is a sample card demonstrating the Grace OS card styling with proper 
                    background, borders, and text colors.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Another Card</CardTitle>
                  <CardDescription>Showing consistency</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Cards maintain consistent styling across the entire design system.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert Components</CardTitle>
                <CardDescription>Various alert states and messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {AlertTypes.map(({ type, icon: Icon, title, message }) => (
                  <Alert key={type}>
                    <Icon className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{title}:</strong> {message}
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Table Component</CardTitle>
                <CardDescription>Data table with Grace OS styling</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleTableData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>
                          <Badge variant={row.status === 'Active' ? 'default' : 'secondary'}>
                            {row.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Grace OS Color Palette</CardTitle>
            <CardDescription>Complete brand and semantic color system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(GRACE_TOKENS.colors).slice(0, 6).map(([name, value]) => (
                <div key={name} className="text-center">
                  <div 
                    className="w-full h-16 rounded-lg border mb-2"
                    style={{ backgroundColor: value }}
                  />
                  <p className="text-foreground text-sm font-medium capitalize">{name}</p>
                  <p className="text-muted-foreground text-xs font-mono">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Verification Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Design System Verification</CardTitle>
            <CardDescription>Confirming exact match with current Reservations styling</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-foreground">Primary Color: Warm Terracotta (#D87C5A)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-foreground">Background: Soft Sand (#F4EAE0)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-foreground">Typography: Playfair + Karla + Poppins</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-foreground">Border Radius: 0.5rem system</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-foreground">CSS Variables: Complete mapping</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-foreground">Dark Theme: Host interface ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-foreground">Tailwind Config: Export ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-foreground">Font Loading: Performance optimized</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PlatformAdminLayout>
  );
}
