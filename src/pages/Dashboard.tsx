
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Utensils, BarChart3, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const stats = [
    {
      title: "Today's Reservations",
      value: "24",
      description: "8 more than yesterday",
      icon: Calendar,
      color: "text-primary"
    },
    {
      title: "Total Guests",
      value: "1,247",
      description: "Active in database",
      icon: Users,
      color: "text-secondary"
    },
    {
      title: "Available Tables",
      value: "12",
      description: "Out of 18 total",
      icon: Utensils,
      color: "text-accent"
    },
    {
      title: "Weekly Revenue",
      value: "£4,250",
      description: "From reservations",
      icon: BarChart3,
      color: "text-primary"
    }
  ];

  const recentReservations = [
    { id: 1, guest: "Sarah Johnson", time: "19:00", party: 4, service: "Dinner", status: "Confirmed" },
    { id: 2, guest: "Mike Chen", time: "20:30", party: 2, service: "Dinner", status: "Seated" },
    { id: 3, guest: "Emma Wilson", time: "15:00", party: 6, service: "Afternoon Tea", status: "Confirmed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Grace OS Admin</p>
        </div>
        <div className="flex gap-2">
          <Link to="/host">
            <Button variant="outline">Host Interface</Button>
          </Link>
          <Link to="/widget">
            <Button variant="outline">Booking Widget</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} strokeWidth={2} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Reservations</CardTitle>
            <CardDescription>Latest bookings from today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{reservation.guest}</p>
                    <p className="text-sm text-muted-foreground">
                      {reservation.time} • {reservation.party} guests • {reservation.service}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    reservation.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                    reservation.status === 'Seated' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {reservation.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/services" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
                Add New Service
              </Button>
            </Link>
            <Link to="/tables" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Utensils className="h-4 w-4 mr-2" strokeWidth={2} />
                Manage Tables
              </Button>
            </Link>
            <Link to="/guests" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" strokeWidth={2} />
                View All Guests
              </Button>
            </Link>
            <Link to="/reports" className="block">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" strokeWidth={2} />
                Generate Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
