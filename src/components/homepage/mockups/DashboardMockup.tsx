import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ServicePopularityChart, StatusBreakdownChart } from '@/components/dashboard/DashboardCharts';
import { Calendar, Users, DollarSign, Table, AlertCircle, TrendingUp } from 'lucide-react';
import { mockKpis, mockServicePopularity, mockStatusBreakdown } from '@/data/mockData';

export const DashboardMockup = () => {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Dashboard - Business Analytics</span>
          <span className="sm:hidden">Dashboard</span>
        </CardTitle>
        <CardDescription className="text-sm">
          Real-time KPIs and business insights at a glance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
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
            value={`£${mockKpis.revenue.toLocaleString()}`}
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
        <div className="grid gap-4 sm:gap-6">
          <div className="sm:grid sm:grid-cols-2 sm:gap-6 space-y-4 sm:space-y-0">
            <div className="scale-75 sm:scale-90 origin-center sm:origin-top-left overflow-hidden">
              <ServicePopularityChart data={mockServicePopularity} />
            </div>
            <div className="scale-75 sm:scale-90 origin-center sm:origin-top-right overflow-hidden">
              <StatusBreakdownChart data={mockStatusBreakdown} />
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="border-t pt-3 sm:pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
            <div>
              <div className="text-base sm:text-lg font-bold text-grace-primary">92%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Occupancy</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-green-600">4.8</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Avg Rating</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-blue-600">5.2</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Avg Party</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-purple-600">1.8h</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Avg Duration</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};