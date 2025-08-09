
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlatformDocument {
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

interface PlatformLog {
  id: string;
  type: string;
  content_text?: string;
  severity?: string;
  error_details?: any;
  metadata?: any;
  created_at: string;
  last_modified?: string;
  sha?: string;
}

interface ReportsFilters {
  search?: string;
  type?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const usePlatformDocuments = (filters: ReportsFilters = {}) => {
  return useQuery({
    queryKey: ['platform-documents', filters],
    queryFn: async () => {
      // Use direct query with type assertion
      let query = (supabase as any)
        .from('platform_documents')
        .select('*')
        .order('last_modified', { ascending: false });

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,path.ilike.%${filters.search}%,content_md.ilike.%${filters.search}%`);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PlatformDocument[];
    },
  });
};

export const usePlatformLogs = (filters: ReportsFilters = {}) => {
  return useQuery({
    queryKey: ['platform-logs', filters],
    queryFn: async () => {
      // Use direct query with type assertion
      let query = (supabase as any)
        .from('platform_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.search) {
        query = query.or(`type.ilike.%${filters.search}%,content_text.ilike.%${filters.search}%`);
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PlatformLog[];
    },
  });
};

export const usePlatformMetadata = () => {
  return useQuery({
    queryKey: ['platform-metadata'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('platform_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useTriggerScan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ingest-platform-artifacts', {
        body: { trigger: 'manual' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['platform-documents'] });
      queryClient.invalidateQueries({ queryKey: ['platform-logs'] });
      queryClient.invalidateQueries({ queryKey: ['platform-metadata'] });
      
      toast({
        title: "Scan Complete",
        description: `Added ${data.result?.documents || 0} documents with ${data.result?.errors?.length || 0} errors.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Scan Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const usePlatformReportsStats = () => {
  return useQuery({
    queryKey: ['platform-reports-stats'],
    queryFn: async () => {
      const [docsResult, logsResult] = await Promise.all([
        (supabase as any).from('platform_documents').select('id', { count: 'exact', head: true }),
        (supabase as any).from('platform_logs').select('id', { count: 'exact', head: true })
      ]);

      if (docsResult.error) throw docsResult.error;
      if (logsResult.error) throw logsResult.error;

      return {
        totalDocuments: docsResult.count || 0,
        totalLogs: logsResult.count || 0,
      };
    },
  });
};
