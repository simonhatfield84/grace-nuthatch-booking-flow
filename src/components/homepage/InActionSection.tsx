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
    <section className="container mx-auto px-4 py-12 sm:py-20">
      <div className="text-center mb-8 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          See Grace OS in Action
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Experience the power of our restaurant management system through interactive demonstrations 
          of real features built with AI assistance.
        </p>
      </div>

      {/* Mobile: Stack vertically, Desktop: Grid layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8 mb-8 sm:mb-12">
        {/* Demo Navigation - Mobile: Horizontal scroll, Desktop: Vertical list */}
        <div className="order-2 lg:order-1">
          <div className="lg:space-y-4">
            {/* Mobile: Horizontal scrolling cards */}
            <div className="flex gap-3 overflow-x-auto pb-2 lg:hidden">
              {demos.map((demo, index) => {
                const IconComponent = demo.icon;
                return (
                  <Card 
                    key={demo.id} 
                    className={`flex-shrink-0 w-64 cursor-pointer transition-all duration-300 ${
                      index === activeDemo 
                        ? 'ring-2 ring-grace-primary bg-muted/50' 
                        : 'hover:bg-muted/30'
                    }`}
                    onClick={() => setActiveDemo(index)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <div className={`p-1.5 rounded-lg ${demo.color} text-white flex-shrink-0`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 text-sm">{demo.title}</h3>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {demo.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {demo.features.slice(0, 2).map((feature, idx) => (
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

            {/* Desktop: Full cards */}
            <div className="hidden lg:block space-y-4">
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
          </div>
        </div>

        {/* Demo Display */}
        <div className="order-1 lg:order-2 lg:col-span-2">
          <div className="relative">
            {/* Navigation buttons - Mobile: Bottom, Desktop: Top-right */}
            <div className="hidden lg:flex absolute -top-4 right-0 gap-2 z-10">
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

            {/* Demo Content - Mobile optimized */}
            <div className="transition-all duration-500 ease-in-out">
              <div className="w-full overflow-hidden">
                <CurrentComponent />
              </div>
            </div>

            {/* Demo indicators - Enhanced for mobile */}
            <div className="flex justify-center items-center gap-3 mt-4 sm:mt-6">
              {/* Mobile navigation buttons */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevDemo}
                className="lg:hidden h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Indicators */}
              <div className="flex gap-2">
                {demos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveDemo(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeDemo 
                        ? 'bg-grace-primary w-6 sm:w-8' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2'
                    }`}
                  />
                ))}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextDemo}
                className="lg:hidden h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Summary */}
      <div className="border-t pt-8 sm:pt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          <div className="flex flex-col items-center">
            <div className="p-2 sm:p-3 bg-grace-primary/10 rounded-lg mb-2 sm:mb-3">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-grace-primary" />
            </div>
            <h4 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Real-time Updates</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Instant synchronisation across all devices and users
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-2 sm:p-3 bg-blue-600/10 rounded-lg mb-2 sm:mb-3">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <h4 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Smart Analytics</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              AI-powered insights to optimise your restaurant operations
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-2 sm:p-3 bg-green-600/10 rounded-lg mb-2 sm:mb-3">
              <TableProperties className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <h4 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Flexible Management</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Intuitive tools that adapt to your restaurant's unique needs
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-2 sm:p-3 bg-purple-600/10 rounded-lg mb-2 sm:mb-3">
              <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Enterprise Security</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Bank-grade security with comprehensive audit trails
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InActionSection;