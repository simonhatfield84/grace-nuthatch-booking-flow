
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  title: string;
  path: string;
  type: string;
  content_md?: string;
  sha: string;
  file_size?: number;
  last_modified: string;
  created_at: string;
}

interface ReportsViewerProps {
  document: Document;
  onBack: () => void;
}

export const ReportsViewer = ({ document, onBack }: ReportsViewerProps) => {
  const { toast } = useToast();

  const handleCopyContent = () => {
    if (document.content_md) {
      navigator.clipboard.writeText(document.content_md);
      toast({
        title: "Content copied",
        description: "Document content copied to clipboard",
      });
    }
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(document.path);
    toast({
      title: "Path copied",
      description: "File path copied to clipboard",
    });
  };

  const renderContent = () => {
    if (!document.content_md) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No content available for this document</p>
        </div>
      );
    }

    // Simple markdown-like rendering for code blocks
    if (document.path.endsWith('.json')) {
      try {
        const formatted = JSON.stringify(JSON.parse(document.content_md), null, 2);
        return (
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{formatted}</code>
          </pre>
        );
      } catch {
        // Fall through to raw content
      }
    }

    return (
      <div className="prose dark:prose-invert max-w-none">
        <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
          {document.content_md}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyContent}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Content
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyPath}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Copy Path
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{document.title}</CardTitle>
              <CardDescription className="mt-2">
                <span className="font-mono text-xs">{document.path}</span>
              </CardDescription>
            </div>
            <Badge variant="secondary">{document.type}</Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
            {document.file_size && (
              <span>Size: {(document.file_size / 1024).toFixed(1)}KB</span>
            )}
            <span>SHA: {document.sha.substring(0, 8)}...</span>
            <span>Modified: {format(new Date(document.last_modified), 'MMM dd, yyyy HH:mm')}</span>
            <span>Discovered: {format(new Date(document.created_at), 'MMM dd, yyyy HH:mm')}</span>
          </div>
        </CardHeader>
        
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};
