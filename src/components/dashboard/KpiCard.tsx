
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  isLoading?: boolean;
}

export const KpiCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  color = "text-primary",
  isLoading = false
}: KpiCardProps) => {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", color)} strokeWidth={2} />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold">{value}</div>
          )}
          
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground flex-1">{description}</p>
            
            {trend && (
              <div className={cn(
                "flex items-center text-xs font-medium px-1.5 py-0.5 rounded",
                trend.isPositive 
                  ? "text-green-700 bg-green-100" 
                  : "text-red-700 bg-red-100"
              )}>
                <span className="mr-1">
                  {trend.isPositive ? "↗" : "↘"}
                </span>
                {Math.abs(trend.value)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
