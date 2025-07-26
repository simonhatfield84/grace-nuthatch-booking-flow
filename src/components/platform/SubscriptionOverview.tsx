
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVenueSubscriptions, usePaymentTransactions } from "@/hooks/useVenueSubscriptions";
import { TrendingUp, Users, CreditCard, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export function SubscriptionOverview() {
  const { data: subscriptions = [] } = useVenueSubscriptions();
  const { data: transactions = [] } = usePaymentTransactions();

  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
  const totalRevenue = transactions
    .filter(t => t.status === 'succeeded')
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const formatPrice = (cents: number, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'cancelled': return 'secondary';
      case 'past_due': return 'destructive';
      case 'unpaid': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              All time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently paying venues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(
                activeSubscriptions
                  .filter(sub => sub.subscription_plans?.billing_interval === 'month')
                  .reduce((sum, sub) => sum + (sub.subscription_plans?.price_cents || 0), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              MRR from monthly plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriptions.filter(sub => ['past_due', 'unpaid'].includes(sub.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Past due or unpaid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Subscriptions</CardTitle>
          <CardDescription>
            Latest subscription activities and status updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venue</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.slice(0, 10).map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subscription.venues?.name}</div>
                      <div className="text-sm text-muted-foreground">{subscription.venues?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subscription.subscription_plans?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatPrice(subscription.subscription_plans?.price_cents || 0)} / {subscription.subscription_plans?.billing_interval}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(subscription.status)}>
                      {subscription.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {subscription.current_period_end 
                      ? format(new Date(subscription.current_period_end), 'MMM dd, yyyy')
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {formatPrice(subscription.subscription_plans?.price_cents || 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
