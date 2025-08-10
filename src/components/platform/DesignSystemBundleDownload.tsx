
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesignSystemBundleService, BundleFile } from '@/services/designSystemBundleService';
import { Download, Copy, FileText, CheckCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DesignSystemBundleDownload() {
  const [isCreating, setIsCreating] = useState(false);
  const [bundleFiles, setBundleFiles] = useState<BundleFile[]>([]);
  const { toast } = useToast();

  const handleCreateBundle = async () => {
    setIsCreating(true);
    try {
      const files = await DesignSystemBundleService.createBundle();
      setBundleFiles(files);
      toast({
        title: "Bundle Created",
        description: "Design system bundle is ready for download",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create bundle",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadBundle = async () => {
    if (bundleFiles.length === 0) {
      await handleCreateBundle();
      return;
    }

    try {
      await DesignSystemBundleService.downloadBundle(bundleFiles);
      toast({
        title: "Download Started",
        description: "Grace OS design system bundle is downloading",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download bundle",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (type: BundleFile['type']) => {
    switch (type) {
      case 'typescript': return '📘';
      case 'css': return '🎨';
      case 'json': return '📋';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-6">
      {/* Download Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Export Design System Bundle
          </CardTitle>
          <CardDescription>
            Create and download a complete design system package for use in new Lovable projects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={handleDownloadBundle}
              disabled={isCreating}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isCreating ? 'Creating Bundle...' : 'Download Bundle'}
            </Button>
            {bundleFiles.length === 0 && (
              <Button 
                onClick={handleCreateBundle}
                variant="outline"
                disabled={isCreating}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Preview Files
              </Button>
            )}
          </div>
          
          {bundleFiles.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Bundle ready • {bundleFiles.length} files • Ready for upload to Lovable
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use This Bundle</CardTitle>
          <CardDescription>
            Step-by-step guide to integrate Grace OS design system into a new Lovable project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">1. Upload</TabsTrigger>
              <TabsTrigger value="integrate">2. Integrate</TabsTrigger>
              <TabsTrigger value="use">3. Use</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Upload Bundle to New Project</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Download the bundle file above</li>
                  <li>In your new Lovable project, go to Dev Mode</li>
                  <li>Extract and upload these files to the correct locations:
                    <ul className="ml-6 mt-2 space-y-1 list-disc list-inside">
                      <li><code>theme/</code> folder → <code>src/theme/</code></li>
                      <li><code>tokens.json</code> → project root</li>
                      <li><code>tailwind.extend.json</code> → project root</li>
                    </ul>
                  </li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="integrate" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Integrate with Your Project</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium mb-2">1. Add CSS imports to src/index.css:</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs">
                      <div>@import './theme/fonts.css';</div>
                      <div>@import './theme/grace-theme.css';</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => copyToClipboard("@import './theme/fonts.css';\n@import './theme/grace-theme.css';", "CSS imports")}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-2">2. Update tailwind.config.ts:</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs">
                      <div>import graceExtend from "./tailwind.extend.json"</div>
                      <div className="mt-1">// Merge graceExtend.theme.extend into your config</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => copyToClipboard('import graceExtend from "./tailwind.extend.json"\n\n// In your config:\ntheme: {\n  extend: {\n    ...graceExtend.theme.extend,\n    // ... your existing extends\n  }\n}', "Tailwind config")}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="use" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Start Using Grace OS Styling</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium mb-2">Use Tailwind classes:</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs">
                      <div>&lt;div className="bg-background text-foreground"&gt;</div>
                      <div>&nbsp;&nbsp;&lt;h1 className="text-primary font-playfair"&gt;Grace OS&lt;/h1&gt;</div>
                      <div>&lt;/div&gt;</div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-2">Import design tokens:</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs">
                      <div>import &#123; GRACE_TOKENS &#125; from '@/theme/tokens';</div>
                      <div className="mt-1">const primaryColor = GRACE_TOKENS.colors.primary;</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* File Preview */}
      {bundleFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bundle Contents</CardTitle>
            <CardDescription>
              Preview of files included in the design system bundle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {bundleFiles.map((file) => (
                <div key={file.path} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getFileIcon(file.type)}</span>
                    <div>
                      <p className="font-medium text-sm">{file.path}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {file.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {(file.content.length / 1024).toFixed(1)}KB
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(file.content, file.path)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
