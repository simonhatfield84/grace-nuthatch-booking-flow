import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ServicePopularityChart, StatusBreakdownChart } from '@/components/dashboard/DashboardCharts';
import { Calendar, Users, DollarSign, Table, AlertCircle, TrendingUp } from 'lucide-react';
import { mockKpis, mockServicePopularity, mockStatusBreakdown } from '@/data/mockData';

export const DashboardMockup = () => {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Dashboard - Business Analytics
        </CardTitle>
        <CardDescription>
          Real-time KPIs and business insights at a glance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiCard
            title="Today's Bookings"
            value={mockKpis.todayBookings}
            description="Confirmed reservations"
            icon={Calendar}
            trend={{ value: 12, isPositive: true }}
            color="text-grace-primary"
          />
          <KpiCard
            title="Weekly Bookings"
            value={mockKpis.weeklyBookings}
            description="This week's total"
            icon={Calendar}
            trend={{ value: 8, isPositive: true }}
            color="text-blue-600"
          />
          <KpiCard
            title="Guest Database"
            value={mockKpis.guestCount}
            description="Total guests"
            icon={Users}
            trend={{ value: 45, isPositive: true }}
            color="text-green-600"
          />
          <KpiCard
            title="Revenue"
            value={`$${mockKpis.revenue.toLocaleString()}`}
            description="This week"
            icon={DollarSign}
            trend={{ value: 15, isPositive: true }}
            color="text-emerald-600"
          />
          <KpiCard
            title="Available Tables"
            value={mockKpis.availableTables}
            description="Right now"
            icon={Table}
            color="text-blue-500"
          />
          <KpiCard
            title="Unallocated"
            value={mockKpis.unallocatedBookings}
            description="Need attention"
            icon={AlertCircle}
            color="text-amber-600"
          />
        </div>
        
        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="scale-90 origin-top-left">
            <ServicePopularityChart data={mockServicePopularity} />
          </div>
          <div className="scale-90 origin-top-right">
            <StatusBreakdownChart data={mockStatusBreakdown} />
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-grace-primary">92%</div>
              <div className="text-sm text-muted-foreground">Occupancy</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">4.8</div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">5.2</div>
              <div className="text-sm text-muted-foreground">Avg Party</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">1.8h</div>
              <div className="text-sm text-muted-foreground">Avg Duration</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};