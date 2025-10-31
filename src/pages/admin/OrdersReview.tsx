import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrderLinkReviewTable } from "@/components/admin/OrderLinkReviewTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderLinkReview } from "@/types/square";
import { useToast } from "@/hooks/use-toast";
import { Play } from "lucide-react";

export default function OrdersReview() {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  
  const { data: reviews, isLoading, refetch } = useQuery({
    queryKey: ['order-link-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_link_reviews')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any as OrderLinkReview[];
    }
  });

  const handleProcessNow = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('trigger-square-worker');
      
      if (error) throw error;
      
      toast({
        title: "Queue processed",
        description: `Processed ${data?.result?.processed || 0} items, ${data?.result?.failed || 0} failed`
      });
      
      refetch();
    } catch (error: any) {
      console.error('Failed to process queue:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process queue",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Orders Review</h1>
        <p className="text-muted-foreground mt-2">
          Review and link Square orders that couldn't be automatically matched to visits
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>
                {reviews?.length || 0} orders waiting for manual review
              </CardDescription>
            </div>
            <Button onClick={handleProcessNow} disabled={processing} variant="outline">
              <Play className="h-4 w-4 mr-2" />
              {processing ? "Processing..." : "Process Queue Now"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <OrderLinkReviewTable
            reviews={reviews || []}
            isLoading={isLoading}
            onRefresh={refetch}
          />
        </CardContent>
      </Card>
    </div>
  );
}
