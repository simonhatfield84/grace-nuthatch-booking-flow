import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  BarChart3, 
  Layout, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  TrendingUp,
  TableProperties,
  Lock
} from 'lucide-react';
import { HostScreenMockup } from './mockups/HostScreenMockup';
import { DashboardMockup } from './mockups/DashboardMockup';
import { TablesMockup } from './mockups/TablesMockup';
import { SecurityMockup } from './mockups/SecurityMockup';

const demos = [
  {
    id: 'host',
    title: 'Host Screen',
    description: 'Real-time table management and booking coordination',
    icon: Monitor,
    color: 'bg-grace-primary',
    component: HostScreenMockup,
    features: ['Live table status', 'Booking timeline', 'Walk-in management', 'Conflict resolution']
  },
  {
    id: 'dashboard',
    title: 'Analytics Dashboard',
    description: 'Business insights and performance metrics',
    icon: BarChart3,
    color: 'bg-blue-600',
    component: DashboardMockup,
    features: ['Real-time KPIs', 'Interactive charts', 'Trend analysis', 'Custom reporting']
  },
  {
    id: 'tables',
    title: 'Table Management',
    description: 'Visual floor plan and seating arrangements',
    icon: Layout,
    color: 'bg-green-600',
    component: TablesMockup,
    features: ['Floor plan view', 'Section management', 'Capacity planning', 'Availability tracking']
  },
  {
    id: 'security',
    title: 'Security Dashboard',
    description: 'System monitoring and threat detection',
    icon: Shield,
    color: 'bg-purple-600',
    component: SecurityMockup,
    features: ['Real-time monitoring', 'Threat detection', 'Audit logging', 'Security alerts']
  }
];

const InActionSection = () => {
  const [activeDemo, setActiveDemo] = useState(0);

  const nextDemo = () => {
    setActiveDemo((prev) => (prev + 1) % demos.length);
  };

  const prevDemo = () => {
    setActiveDemo((prev) => (prev - 1 + demos.length) % demos.length);
  };

  const currentDemo = demos[activeDemo];
  const CurrentComponent = currentDemo.component;

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          See Grace OS in Action
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Experience the power of our restaurant management system through interactive demonstrations 
          of real features built with AI assistance.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        {/* Demo Navigation */}
        <div className="space-y-4">
          {demos.map((demo, index) => {
            const IconComponent = demo.icon;
            return (
              <Card 
                key={demo.id} 
                className={`cursor-pointer transition-all duration-300 ${
                  index === activeDemo 
                    ? 'ring-2 ring-grace-primary bg-muted/50' 
                    : 'hover:bg-muted/30'
                }`}
                onClick={() => setActiveDemo(index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${demo.color} text-white`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{demo.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {demo.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {demo.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Demo Display */}
        <div className="lg:col-span-2">
          <div className="relative">
            {/* Navigation buttons */}
            <div className="absolute -top-4 right-0 flex gap-2 z-10">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevDemo}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextDemo}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Demo Content */}
            <div className="transition-all duration-500 ease-in-out">
              <CurrentComponent />
            </div>

            {/* Demo indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {demos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveDemo(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === activeDemo 
                      ? 'bg-grace-primary w-8' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Summary */}
      <div className="border-t pt-12">
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <div className="p-3 bg-grace-primary/10 rounded-lg mb-3">
              <Calendar className="h-6 w-6 text-grace-primary" />
            </div>
            <h4 className="font-semibold mb-2">Real-time Updates</h4>
            <p className="text-sm text-muted-foreground">
              Instant synchronization across all devices and users
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-3 bg-blue-600/10 rounded-lg mb-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-semibold mb-2">Smart Analytics</h4>
            <p className="text-sm text-muted-foreground">
              AI-powered insights to optimize your restaurant operations
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-3 bg-green-600/10 rounded-lg mb-3">
              <TableProperties className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold mb-2">Flexible Management</h4>
            <p className="text-sm text-muted-foreground">
              Intuitive tools that adapt to your restaurant's unique needs
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-3 bg-purple-600/10 rounded-lg mb-3">
              <Lock className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold mb-2">Enterprise Security</h4>
            <p className="text-sm text-muted-foreground">
              Bank-grade security with comprehensive audit trails
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InActionSection;