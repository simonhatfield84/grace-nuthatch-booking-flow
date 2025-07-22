
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Calendar, CreditCard, RefreshCw, Globe, Settings } from "lucide-react";
import { BookingStats } from "../bookings/BookingStats";
import { DashboardCharts } from "./DashboardCharts";
import { EnhancedPaymentAnalytics } from "./EnhancedPaymentAnalytics";
import { PaymentRecoveryPanel } from "./PaymentRecoveryPanel";
import { WebhookMonitor } from "./WebhookMonitor";
import { AlertsPanel } from "./AlertsPanel";

export const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening at your venue.</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="recovery" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Recovery
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <BookingStats selectedDate={selectedDate} />
          <DashboardCharts />
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <BookingStats selectedDate={selectedDate} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <EnhancedPaymentAnalytics />
        </TabsContent>

        <TabsContent value="recovery" className="space-y-4">
          <PaymentRecoveryPanel />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <WebhookMonitor />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertsPanel unallocatedBookings={[]} tableUtilization={45} />
        </TabsContent>

      </Tabs>
    </div>
  );
};
