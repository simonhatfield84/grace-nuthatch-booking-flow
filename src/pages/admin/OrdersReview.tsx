import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrderLinkReviewTable } from "@/components/admin/OrderLinkReviewTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderLinkReview } from "@/types/square";

export default function OrdersReview() {
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
          <CardTitle>Pending Reviews</CardTitle>
          <CardDescription>
            {reviews?.length || 0} orders waiting for manual review
          </CardDescription>
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
