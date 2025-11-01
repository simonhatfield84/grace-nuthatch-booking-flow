import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Info, TrendingUp, AlertTriangle } from "lucide-react";

export const GuestInsightsDocumentation = () => {
  const { data: tagCounts } = useQuery({
    queryKey: ['tag-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_tags')
        .select('tag_id, tags(name, color, is_automatic)')
        .eq('tags.is_automatic', true);
      
      if (error) throw error;
      
      const counts: Record<string, { count: number; color: string }> = {};
      data?.forEach((item: any) => {
        const tagName = item.tags?.name;
        if (tagName) {
          counts[tagName] = counts[tagName] || { count: 0, color: item.tags.color };
          counts[tagName].count++;
        }
      });
      
      return counts;
    }
  });

  const autoTags = [
    {
      name: "Regular",
      color: "#10B981",
      criteria: "3+ visits within 3 months",
      purpose: "Identify your loyal regulars for retention programs"
    },
    {
      name: "Ex-Regular",
      color: "#F59E0B",
      criteria: "Previously Regular, no visit in 4+ weeks",
      purpose: "Win-back campaign targets - re-engage lapsed regulars"
    },
    {
      name: "HV",
      color: "#8B5CF6",
      criteria: "Average spend per cover > £50",
      purpose: "High-value guests who deserve premium service"
    },
    {
      name: "High Spend",
      color: "#EC4899",
      criteria: "Total lifetime spend > £500",
      purpose: "Reward and recognize top spenders"
    },
    {
      name: "VIP",
      color: "#EF4444",
      criteria: "Total spend > £500 AND avg cover > £50",
      purpose: "Top-tier guests (replaces all other auto-tags)"
    },
    {
      name: "Weekend Warrior",
      color: "#06B6D4",
      criteria: "80%+ bookings on Fri-Sun",
      purpose: "Target weekend promotions and special events"
    },
    {
      name: "Group Organizer",
      color: "#8B5CF6",
      criteria: "50%+ bookings with 6+ guests",
      purpose: "Private dining offers and group packages"
    },
    {
      name: "At Risk",
      color: "#EF4444",
      criteria: "Churn risk score > 0.7",
      purpose: "Proactive retention outreach needed"
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Understanding Guest Insights
          </CardTitle>
          <CardDescription>
            Learn how automatic tags and advanced metrics help you understand and engage with your guests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Automatic Tags Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Automatic Tags</h3>
            <p className="text-sm text-muted-foreground mb-4">
              These tags are automatically assigned based on guest behavior and spending patterns. 
              They update in real-time as guest data changes.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Tag</th>
                    <th className="text-left p-3 font-semibold">Criteria</th>
                    <th className="text-left p-3 font-semibold">Purpose</th>
                    <th className="text-right p-3 font-semibold">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {autoTags.map((tag) => (
                    <tr key={tag.name} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          style={{ 
                            backgroundColor: tag.color + '20', 
                            borderColor: tag.color, 
                            color: tag.color 
                          }}
                        >
                          {tag.name}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{tag.criteria}</td>
                      <td className="p-3 text-sm text-muted-foreground">{tag.purpose}</td>
                      <td className="p-3 text-right font-semibold">
                        {tagCounts?.[tag.name]?.count || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Special Tag Behavior:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong className="text-foreground">VIP tag</strong> replaces all other automatic tags when assigned</li>
                <li>• Tags are recalculated automatically when guest metrics change</li>
                <li>• Manual tags can be added separately and won't be removed automatically</li>
              </ul>
            </div>
          </div>

          {/* Advanced Metrics Section */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Lifetime Value (LTV)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Predicted lifetime value estimates how much a guest is worth to your business over the next 12 months.
              </p>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">How it's calculated:</h4>
                      <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Average spend per visit × Historical visit frequency</li>
                        <li>Projected forward 12 months</li>
                        <li>Adjusted by recent spending trends (increasing/decreasing)</li>
                        <li>Weighted by time since last visit</li>
                        <li>Reduced by cancellation and no-show rates</li>
                      </ol>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">LTV Segments:</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                            BRONZE
                          </Badge>
                          <span className="text-sm">£0-250</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                            SILVER
                          </Badge>
                          <span className="text-sm">£251-500</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            GOLD
                          </Badge>
                          <span className="text-sm">£501-1,000</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                            PLATINUM
                          </Badge>
                          <span className="text-sm">£1,000+</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Churn Risk Score
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Measures the likelihood that a guest won't return, helping you identify who needs attention.
              </p>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Factors weighted:</h4>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• <strong className="text-foreground">40%</strong> - Days since last visit vs historical average</li>
                        <li>• <strong className="text-foreground">30%</strong> - Visit frequency trend (last 3 months vs prior 3)</li>
                        <li>• <strong className="text-foreground">20%</strong> - Spending trend (increasing/decreasing)</li>
                        <li>• <strong className="text-foreground">10%</strong> - Email engagement (when available)</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Risk Levels:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded bg-green-50 border border-green-200">
                          <span className="text-sm font-medium">0-30%</span>
                          <Badge className="bg-green-100 text-green-800 border-green-300">Low Risk</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-yellow-50 border border-yellow-200">
                          <span className="text-sm font-medium">31-50%</span>
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Medium Risk</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-orange-50 border border-orange-200">
                          <span className="text-sm font-medium">51-70%</span>
                          <Badge className="bg-orange-100 text-orange-800 border-orange-300">Elevated Risk</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-red-50 border border-red-200">
                          <span className="text-sm font-medium">71-100%</span>
                          <Badge className="bg-red-100 text-red-800 border-red-300">High Risk</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
