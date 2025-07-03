
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users, Mail, Phone, Star } from "lucide-react";

const Guests = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [guests] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+44 7700 900123",
      visitCount: 8,
      optInMarketing: true,
      notes: "Vegetarian, prefers window tables",
      lastVisit: "2024-01-15",
      totalSpent: 450
    },
    {
      id: 2,
      name: "Mike Chen",
      email: "mike.chen@email.com",
      phone: "+44 7700 900456",
      visitCount: 3,
      optInMarketing: false,
      notes: "Allergic to nuts",
      lastVisit: "2024-01-10",
      totalSpent: 180
    },
    {
      id: 3,
      name: "Emma Wilson",
      email: "emma.wilson@email.com",
      phone: "+44 7700 900789",
      visitCount: 12,
      optInMarketing: true,
      notes: "Regular customer, loves afternoon tea",
      lastVisit: "2024-01-12",
      totalSpent: 720
    },
    {
      id: 4,
      name: "James Brown",
      email: "james.brown@email.com",
      phone: "+44 7700 900012",
      visitCount: 1,
      optInMarketing: true,
      notes: "New customer, celebrating anniversary",
      lastVisit: "2024-01-08",
      totalSpent: 95
    },
    {
      id: 5,
      name: "Lisa Davis",
      email: "lisa.davis@email.com",
      phone: "+44 7700 900345",
      visitCount: 6,
      optInMarketing: true,
      notes: "Business lunches, prefers quiet tables",
      lastVisit: "2024-01-14",
      totalSpent: 380
    }
  ]);

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.phone.includes(searchTerm)
  );

  const totalGuests = guests.length;
  const returningGuests = guests.filter(g => g.visitCount > 1).length;
  const marketingOptIns = guests.filter(g => g.optInMarketing).length;
  const totalRevenue = guests.reduce((sum, g) => sum + g.totalSpent, 0);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getGuestTier = (visitCount: number) => {
    if (visitCount >= 10) return { label: "VIP", color: "bg-yellow-100 text-yellow-800" };
    if (visitCount >= 5) return { label: "Regular", color: "bg-blue-100 text-blue-800" };
    if (visitCount > 1) return { label: "Returning", color: "bg-green-100 text-green-800" };
    return { label: "New", color: "bg-gray-100 text-gray-800" };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guests</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Button>
          <Users className="h-4 w-4 mr-2" strokeWidth={2} />
          Import Guests
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Guests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGuests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Returning Guests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returningGuests}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((returningGuests / totalGuests) * 100)}% return rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Marketing Opt-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingOptIns}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((marketingOptIns / totalGuests) * 100)}% opted in
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">from tracked visits</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guest Search</CardTitle>
          <CardDescription>Find and manage your guests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" strokeWidth={2} />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGuests.map((guest) => {
          const tier = getGuestTier(guest.visitCount);
          return (
            <Card key={guest.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(guest.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{guest.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={tier.color} variant="secondary">
                          {tier.label}
                        </Badge>
                        {guest.visitCount >= 10 && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" strokeWidth={2} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                    <span className="truncate">{guest.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                    <span>{guest.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold">{guest.visitCount}</div>
                    <div className="text-xs text-muted-foreground">Visits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">£{guest.totalSpent}</div>
                    <div className="text-xs text-muted-foreground">Spent</div>
                  </div>
                </div>

                {guest.notes && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    {guest.notes}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Last visit: {new Date(guest.lastVisit).toLocaleDateString()}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredGuests.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" strokeWidth={2} />
            <p className="text-muted-foreground">No guests found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Guests;
