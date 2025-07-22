
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingGrid } from "@/components/bookings/BookingGrid";
import { PaymentAnalytics } from "./PaymentAnalytics";
import { BarChart, CreditCard, Calendar, Users } from "lucide-react";

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your bookings, payments, and venue performance.
        </p>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <BookingGrid />
        </TabsContent>

        <TabsContent value="analytics">
          <div className="text-center py-8 text-muted-foreground">
            Analytics dashboard coming soon...
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <PaymentAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};
