
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, User, Clock, Users, MapPin, Loader2 } from "lucide-react";

interface ValidationPanelProps {
  walkInData: any;
  onConfirm: () => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string | null;
}

export function ValidationPanel({ 
  walkInData, 
  onConfirm, 
  onBack, 
  isLoading, 
  error 
}: ValidationPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Confirm Walk-in</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{walkInData.guestName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{walkInData.partySize} guests</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{walkInData.time}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Table {walkInData.tableId}</span>
            </div>
          </div>

          {walkInData.notes && (
            <div>
              <p className="text-sm font-medium text-gray-700">Notes:</p>
              <p className="text-sm text-gray-600">{walkInData.notes}</p>
            </div>
          )}

          <div className="flex space-x-2">
            <Badge variant="secondary">Walk-in</Badge>
            <Badge variant="outline">Seated Immediately</Badge>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between space-x-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Confirm Walk-in'
          )}
        </Button>
      </div>
    </div>
  );
}
