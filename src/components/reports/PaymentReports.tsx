
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PaymentReport } from "@/types/core";

export const PaymentReports = () => {
  const [reports, setReports] = useState<PaymentReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<PaymentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    loadPaymentReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, statusFilter, dateFromFilter, dateToFilter, searchTerm]);

  const loadPaymentReports = async () => {
    try {
      // Query existing booking_payments table with joins
      const { data, error } = await supabase
        .from('booking_payments')
        .select(`
          *,
          bookings!inner (
            venue_id,
            booking_date,
            guest_name,
            party_size,
            service
          )
        `);

      if (error) throw error;

      // Transform data to match PaymentReport interface
      const transformedReports: PaymentReport[] = data.map(payment => ({
        id: payment.id,
        booking_id: payment.booking_id,
        venue_id: payment.bookings.venue_id,
        amount_cents: payment.amount_cents,
        status: payment.status,
        refund_amount_cents: payment.refund_amount_cents || 0,
        refund_status: payment.refund_status || 'none',
        payment_date: payment.created_at,
        refunded_at: payment.refunded_at || undefined,
        booking_date: payment.bookings.booking_date,
        guest_name: payment.bookings.guest_name,
        party_size: payment.bookings.party_size,
        service_name: payment.bookings.service,
      }));

      setReports(transformedReports);
    } catch (error) {
      console.error('Error loading payment reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Date filters
    if (dateFromFilter) {
      filtered = filtered.filter(report => 
        new Date(report.payment_date) >= new Date(dateFromFilter)
      );
    }
    
    if (dateToFilter) {
      filtered = filtered.filter(report => 
        new Date(report.payment_date) <= new Date(dateToFilter)
      );
    }

    // Search term
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.service_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  };

  const exportToCsv = () => {
    const csvHeaders = [
      'Date',
      'Guest Name',
      'Service',
      'Party Size',
      'Amount',
      'Status',
      'Refund Amount',
      'Refund Status'
    ];

    const csvData = filteredReports.map(report => [
      new Date(report.payment_date).toLocaleDateString(),
      report.guest_name,
      report.service_name || '',
      report.party_size,
      `£${(report.amount_cents / 100).toFixed(2)}`,
      report.status,
      `£${(report.refund_amount_cents / 100).toFixed(2)}`,
      report.refund_status
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge variant="default" className="bg-green-100 text-green-800">Successful</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRefundBadge = (refundStatus: string) => {
    switch (refundStatus) {
      case 'none':
        return <Badge variant="outline">None</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">{refundStatus}</Badge>;
    }
  };

  const totalRevenue = filteredReports.reduce((sum, report) => sum + (report.amount_cents - report.refund_amount_cents), 0);
  const totalRefunds = filteredReports.reduce((sum, report) => sum + report.refund_amount_cents, 0);

  if (isLoading) {
    return <div>Loading payment reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Reports</h1>
          <p className="text-muted-foreground">
            View and export payment transaction reports
          </p>
        </div>
        <Button onClick={exportToCsv} disabled={filteredReports.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{(totalRevenue / 100).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredReports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{(totalRefunds / 100).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Rate</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredReports.length > 0 
                ? ((filteredReports.filter(r => r.status === 'succeeded').length / filteredReports.length) * 100).toFixed(1)
                : 0}%
            </div>
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
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="succeeded">Successful</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Guest name or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all");
                  setDateFromFilter("");
                  setDateToFilter("");
                  setSearchTerm("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>
            {filteredReports.length} transaction{filteredReports.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Party Size</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Refund Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{new Date(report.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{report.guest_name}</TableCell>
                  <TableCell>{report.service_name}</TableCell>
                  <TableCell>{report.party_size}</TableCell>
                  <TableCell>£{(report.amount_cents / 100).toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>£{(report.refund_amount_cents / 100).toFixed(2)}</TableCell>
                  <TableCell>{getRefundBadge(report.refund_status)}</TableCell>
                </TableRow>
              ))}
              {filteredReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No payment transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
