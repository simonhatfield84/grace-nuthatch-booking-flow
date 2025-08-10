
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesignSystemBundleService, BundleFile } from '@/services/designSystemBundleService';
import { Copy, FileText, CheckCircle, Package, FolderPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DesignSystemBundleDownload() {
  const [isCreating, setIsCreating] = useState(false);
  const [bundleFiles, setBundleFiles] = useState<BundleFile[]>([]);
  const { toast } = useToast();

  const handleGenerateFiles = async () => {
    setIsCreating(true);
    try {
      const files = await DesignSystemBundleService.createBundle();
      setBundleFiles(files);
      toast({
        title: "Files Generated",
        description: "Design system files are ready to copy",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate files",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
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
      {/* Generate Files Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Export Design System Files
          </CardTitle>
          <CardDescription>
            Generate individual files to manually create in your new Lovable project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={handleGenerateFiles}
              disabled={isCreating}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isCreating ? 'Generating Files...' : 'Generate Files'}
            </Button>
          </div>
          
          {bundleFiles.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {bundleFiles.length} files ready • Copy each file content to your new project
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Transfer to New Lovable Project</CardTitle>
          <CardDescription>
            Step-by-step guide to manually create files in Lovable Dev Mode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create">1. Create Files</TabsTrigger>
              <TabsTrigger value="integrate">2. Integrate</TabsTrigger>
              <TabsTrigger value="use">3. Use</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" />
                  Create Files in Dev Mode
                </h4>
                <div className="space-y-3 text-sm bg-muted p-4 rounded-lg">
                  <p className="font-medium">In your new Lovable project:</p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Click the <strong>Dev Mode</strong> toggle in the top left</li>
                    <li>For each file shown below, click <strong>+ Create File</strong></li>
                    <li>Enter the exact file path (e.g., <code>src/theme/tokens.ts</code>)</li>
                    <li>Copy and paste the file content using the Copy buttons</li>
                    <li>Save the file</li>
                  </ol>
                  <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
                    <strong>Important:</strong> Create folders as needed. If <code>src/theme/</code> doesn't exist, create it first.
                  </div>
                </div>
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

      {/* File Contents Display */}
      {bundleFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Files to Create</CardTitle>
            <CardDescription>
              Copy each file content and create in your new Lovable project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {bundleFiles.map((file) => (
                <div key={file.path} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
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
                      Copy Content
                    </Button>
                  </div>
                  
                  <div className="bg-muted rounded-md p-3 max-h-96 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {file.content}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Folder Structure Guide */}
      {bundleFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Required Folder Structure</CardTitle>
            <CardDescription>
              Create these folders in your new project before adding files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <div>your-project/</div>
              <div>├── src/</div>
              <div>│&nbsp;&nbsp;&nbsp;└── theme/</div>
              <div>│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── tokens.ts</div>
              <div>│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── grace-theme.css</div>
              <div>│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── fonts.css</div>
              <div>├── tokens.json</div>
              <div>├── tailwind.extend.json</div>
              <div>├── README.md</div>
              <div>└── INTEGRATION.md</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
