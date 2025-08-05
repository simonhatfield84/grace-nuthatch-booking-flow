
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSubscriptionPlans, useCreateSubscriptionPlan, useUpdateSubscriptionPlan } from "@/hooks/useSubscriptionPlans";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, DollarSign } from "lucide-react";

export function SubscriptionPlansManager() {
  const { toast } = useToast();
  const { data: plans = [] } = useSubscriptionPlans();
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_cents: 0,
    currency: "usd",
    billing_interval: "month",
    features: "",
    max_venues: 1,
    max_bookings_per_month: null,
    is_active: true,
    stripe_price_id: ""
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price_cents: 0,
      currency: "usd",
      billing_interval: "month",
      features: "",
      max_venues: 1,
      max_bookings_per_month: null,
      is_active: true,
      stripe_price_id: ""
    });
    setEditingPlan(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const planData = {
        ...formData,
        features: formData.features.split('\n').filter(f => f.trim()),
        max_bookings_per_month: formData.max_bookings_per_month || null
      };

      if (editingPlan) {
        await updatePlan.mutateAsync({ id: editingPlan.id, ...planData });
        toast({
          title: "Plan updated",
          description: "Subscription plan has been updated successfully.",
        });
      } else {
        await createPlan.mutateAsync(planData);
        toast({
          title: "Plan created",
          description: "New subscription plan has been created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save subscription plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price_cents: plan.price_cents,
      currency: plan.currency,
      billing_interval: plan.billing_interval,
      features: plan.features.join('\n'),
      max_venues: plan.max_venues || 1,
      max_bookings_per_month: plan.max_bookings_per_month,
      is_active: plan.is_active,
      stripe_price_id: plan.stripe_price_id || ""
    });
    setIsDialogOpen(true);
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Subscription Plans
            </CardTitle>
            <CardDescription>
              Manage pricing plans and features for venues
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Edit Plan" : "Create New Plan"}
                </DialogTitle>
                <DialogDescription>
                  Configure the subscription plan details and pricing.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (cents)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price_cents}
                        onChange={(e) => setFormData({ ...formData, price_cents: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interval">Billing</Label>
                      <select
                        id="interval"
                        value={formData.billing_interval}
                        onChange={(e) => setFormData({ ...formData, billing_interval: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="month">Monthly</option>
                        <option value="year">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="features">Features (one per line)</Label>
                    <Textarea
                      id="features"
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      rows={3}
                      placeholder="Up to 100 bookings/month&#10;Basic reporting&#10;Email support"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-venues">Max Venues</Label>
                      <Input
                        id="max-venues"
                        type="number"
                        value={formData.max_venues}
                        onChange={(e) => setFormData({ ...formData, max_venues: parseInt(e.target.value) || 1 })}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-bookings">Max Bookings/Month</Label>
                      <Input
                        id="max-bookings"
                        type="number"
                        value={formData.max_bookings_per_month || ""}
                        onChange={(e) => setFormData({ ...formData, max_bookings_per_month: parseInt(e.target.value) || null })}
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="active">Active Plan</Label>
                    <Switch
                      id="active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPlan.isPending || updatePlan.isPending}>
                    {editingPlan ? "Update Plan" : "Create Plan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{plan.name}</div>
                    <div className="text-sm text-muted-foreground">{plan.description}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {formatPrice(plan.price_cents, plan.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    per {plan.billing_interval}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{plan.max_venues} venue{plan.max_venues !== 1 ? 's' : ''}</div>
                    <div>
                      {plan.max_bookings_per_month 
                        ? `${plan.max_bookings_per_month} bookings/month`
                        : 'Unlimited bookings'
                      }
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
