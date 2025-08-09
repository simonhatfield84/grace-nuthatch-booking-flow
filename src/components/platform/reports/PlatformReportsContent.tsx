
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReportsFilters } from "./ReportsFilters";
import { ReportsViewer } from "./ReportsViewer";
import { usePlatformDocuments, usePlatformLogs, useTriggerScan, usePlatformReportsStats } from "@/hooks/usePlatformReports";
import { FileText, AlertTriangle, Database, RefreshCw, Calendar, Search } from "lucide-react";
import { format } from "date-fns";

interface ReportsFilters {
  search?: string;
  type?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const PlatformReportsContent = () => {
  const [filters, setFilters] = useState<ReportsFilters>({});
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("documents");

  const { data: documents, isLoading: docsLoading } = usePlatformDocuments(filters);
  const { data: logs, isLoading: logsLoading } = usePlatformLogs(filters);
  const { data: stats, isLoading: statsLoading } = usePlatformReportsStats();
  const triggerScan = useTriggerScan();

  const handleFilterChange = (newFilters: ReportsFilters) => {
    setFilters(newFilters);
  };

  const handleScanTrigger = () => {
    triggerScan.mutate();
  };

  if (selectedDocument) {
    return (
      <ReportsViewer 
        document={selectedDocument}
        onBack={() => setSelectedDocument(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Reports Hub</h1>
          <p className="text-muted-foreground">
            Centralized monitoring and analysis of platform artifacts
          </p>
        </div>
        <Button 
          onClick={handleScanTrigger}
          disabled={triggerScan.isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${triggerScan.isPending ? 'animate-spin' : ''}`} />
          {triggerScan.isPending ? 'Scanning...' : 'Trigger Scan'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalDocuments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Platform artifacts and documentation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalLogs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              System events and errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Scan</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents && documents.length > 0 
                ? format(new Date(documents[0].created_at), 'MMM dd')
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Automated file discovery
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <ReportsFilters onFiltersChange={handleFilterChange} activeTab={activeTab} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Platform Documents</CardTitle>
              <CardDescription>
                Discovered markdown files, JSON configs, and documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => setSelectedDocument(doc)}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground">{doc.path}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{doc.type}</Badge>
                          {doc.file_size && (
                            <span className="text-xs text-muted-foreground">
                              {(doc.file_size / 1024).toFixed(1)}KB
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(doc.last_modified), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try triggering a scan to discover platform artifacts
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Platform Logs</CardTitle>
              <CardDescription>
                System events, errors, and operational logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : logs && logs.length > 0 ? (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={log.severity === 'error' ? 'destructive' : 
                                      log.severity === 'warning' ? 'default' : 'secondary'}
                            >
                              {log.severity || 'info'}
                            </Badge>
                            <span className="text-sm font-medium">{log.type}</span>
                          </div>
                          <p className="text-sm">{log.content_text}</p>
                          {log.error_details && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(log.error_details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No logs found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Platform events and errors will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
