
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Filter, Search, TrendingUp, DollarSign, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PaymentReport {
  id: string;
  booking_id: number;
  amount_cents: number;
  status: string;
  refund_amount_cents: number;
  refund_status: string;
  payment_date: string;
  refunded_at: string | null;
  booking_date: string;
  guest_name: string;
  party_size: number;
  service_name: string;
}

export const PaymentReports = () => {
  const [payments, setPayments] = useState<PaymentReport[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    loadPaymentData();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter, dateFrom, dateTo]);

  const loadPaymentData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_analytics')
        .select('*')
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.booking_id.toString().includes(searchTerm) ||
        payment.service_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Date filter
    if (dateFrom) {
      filtered = filtered.filter(payment => 
        new Date(payment.payment_date) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      filtered = filtered.filter(payment => 
        new Date(payment.payment_date) <= new Date(dateTo)
      );
    }

    setFilteredPayments(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAmount = (pence: number) => `£${(pence / 100).toFixed(2)}`;

  const calculateTotals = () => {
    const totalRevenue = filteredPayments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount_cents, 0);

    const totalRefunds = filteredPayments
      .reduce((sum, p) => sum + (p.refund_amount_cents || 0), 0);

    const netRevenue = totalRevenue - totalRefunds;

    return {
      totalRevenue,
      totalRefunds,
      netRevenue,
      totalTransactions: filteredPayments.length,
      successfulTransactions: filteredPayments.filter(p => p.status === 'succeeded').length
    };
  };

  const exportToCSV = () => {
    const headers = [
      'Booking ID',
      'Guest Name',
      'Service',
      'Party Size',
      'Booking Date',
      'Payment Date',
      'Amount',
      'Status',
      'Refund Amount',
      'Refund Status',
      'Net Amount'
    ];

    const csvData = filteredPayments.map(payment => [
      payment.booking_id,
      payment.guest_name || '',
      payment.service_name || '',
      payment.party_size || 0,
      payment.booking_date,
      format(new Date(payment.payment_date), 'yyyy-MM-dd HH:mm'),
      formatAmount(payment.amount_cents),
      payment.status,
      formatAmount(payment.refund_amount_cents || 0),
      payment.refund_status || 'none',
      formatAmount(payment.amount_cents - (payment.refund_amount_cents || 0))
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payment Reports</h2>
        <Button onClick={loadPaymentData} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totals.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {totals.successfulTransactions} successful transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totals.totalRefunds)}</div>
            <p className="text-xs text-muted-foreground">
              Refunded to customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totals.netRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              After refunds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.totalTransactions > 0 
                ? `${Math.round((totals.successfulTransactions / totals.totalTransactions) * 100)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Payment success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="succeeded">Successful</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From date"
            />

            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To date"
            />

            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History ({filteredPayments.length} records)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>#{payment.booking_id}</TableCell>
                  <TableCell>{payment.guest_name || 'N/A'}</TableCell>
                  <TableCell>{payment.service_name || 'N/A'}</TableCell>
                  <TableCell>
                    {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{formatAmount(payment.amount_cents)}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>
                    {payment.refund_amount_cents > 0 ? (
                      <span className="text-red-600">
                        -{formatAmount(payment.refund_amount_cents)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatAmount(payment.amount_cents - (payment.refund_amount_cents || 0))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
