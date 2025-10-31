import { useState } from "react";
import { format } from "date-fns";
import { OrderLinkReview } from "@/types/square";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkToVisitDialog } from "./LinkToVisitDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link2, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface OrderLinkReviewTableProps {
  reviews: OrderLinkReview[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function OrderLinkReviewTable({ reviews, isLoading, onRefresh }: OrderLinkReviewTableProps) {
  const [selectedReview, setSelectedReview] = useState<OrderLinkReview | null>(null);
  const [dismissingReview, setDismissingReview] = useState<OrderLinkReview | null>(null);
  const { toast } = useToast();

  const formatCurrency = (cents: number | null) => {
    if (!cents) return '-';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(cents / 100);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence < 0.3) return <Badge variant="destructive">Low</Badge>;
    if (confidence < 0.7) return <Badge variant="outline">Medium</Badge>;
    return <Badge variant="default">High</Badge>;
  };

  const handleDismiss = async () => {
    if (!dismissingReview) return;

    try {
      const { error } = await supabase.rpc('resolve_order_review', {
        p_review_id: dismissingReview.id,
        p_action: 'dismiss'
      });

      if (error) throw error;

      toast({
        title: "Review dismissed",
        description: "The order review has been dismissed"
      });

      onRefresh();
    } catch (error) {
      console.error('Failed to dismiss review:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss review",
        variant: "destructive"
      });
    } finally {
      setDismissingReview(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pending reviews. All orders are linked!
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Device/Source</TableHead>
            <TableHead>Table</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => {
            const snapshot = review.snapshot || {};
            const deviceSource = snapshot.source_name || (snapshot.device_id ? `Device ${snapshot.device_id.slice(0, 8)}` : null);
            const tableNames = snapshot.table_names?.length > 0 ? snapshot.table_names.join(', ') : null;
            
            return (
              <TableRow key={review.id}>
                <TableCell className="text-sm">
                  {snapshot.opened_at
                    ? format(new Date(snapshot.opened_at), 'MMM d, HH:mm')
                    : format(new Date(review.created_at), 'MMM d, HH:mm')}
                </TableCell>
                <TableCell className="font-medium">
                  {snapshot.money?.total ? formatCurrency(snapshot.money.total) : '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {deviceSource || '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {tableNames || '-'}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {snapshot.customer_id ? `${snapshot.customer_id.slice(0, 8)}...` : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={review.reason === 'no_venue_mapping' ? 'destructive' : 'outline'}>
                    {review.reason.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedReview(review)}
                  >
                    <Link2 className="h-4 w-4 mr-1" />
                    Link
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDismissingReview(review)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {selectedReview && (
        <LinkToVisitDialog
          review={selectedReview}
          open={!!selectedReview}
          onClose={() => setSelectedReview(null)}
          onSuccess={() => {
            setSelectedReview(null);
            onRefresh();
          }}
        />
      )}

      <AlertDialog open={!!dismissingReview} onOpenChange={(open) => !open && setDismissingReview(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss Review?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the review as resolved without linking the order to a visit. You can still link it manually later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDismiss}>Dismiss</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
