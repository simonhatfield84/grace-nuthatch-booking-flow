
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TableStatsProps {
  totalTables: number;
  totalSeats: number;
  onlineBookableSeats: number;
}

export const TableStats = ({ totalTables, totalSeats, onlineBookableSeats }: TableStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Tables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTables}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Seats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSeats}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Online Bookable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{onlineBookableSeats}</div>
          <p className="text-xs text-muted-foreground">seats available online</p>
        </CardContent>
      </Card>
    </div>
  );
};
