import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WebhookMonitor } from "./WebhookMonitor";
import { QuickReconciliation } from "./QuickReconciliation";

export const AdminDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { refetch } = useQuery({
    queryKey: ['admin-dashboard-data'],
    queryFn: async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('some_table') // Replace with your actual table name
          .select('*');

        if (error) {
          setError(error);
          throw error;
        }

        setData(data);
        return data;
      } catch (error: any) {
        setError(error);
        console.error("Error fetching data:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    enabled: false, // Disable automatic fetching
  });

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Quick Reconciliation for immediate fix */}
      <QuickReconciliation />

      {/* Webhook monitoring */}
      <WebhookMonitor />

      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <div>
          {/* Display your data here */}
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
