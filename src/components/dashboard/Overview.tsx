
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OverviewProps {
  data: any;
}

export function Overview({ data }: OverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Overview chart coming soon...</p>
      </CardContent>
    </Card>
  );
}
