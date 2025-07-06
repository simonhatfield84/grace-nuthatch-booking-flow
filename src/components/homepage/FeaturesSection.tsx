
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Users, Calendar, BarChart3 } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Booking Management',
      description: 'Intelligent table allocation, automated confirmations, and conflict detection built through AI-human collaboration.'
    },
    {
      icon: Users,
      title: 'Guest Database',
      description: 'Comprehensive guest profiles, visit history, and smart duplicate detection developed iteratively with AI assistance.'
    },
    {
      icon: ChefHat,
      title: 'Service Management',
      description: 'Multiple dining services with customizable booking windows and duration rules architected through collaborative AI development.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Real-time KPIs and business insights with interactive charts built using AI-suggested best practices and libraries.'
    }
  ];

  return (
    <section id="features" className="container mx-auto px-4 py-20 bg-muted/30">
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
        What We've Built Together
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Card key={feature.title}>
              <CardHeader>
                <IconComponent className="h-8 w-8 text-grace-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturesSection;
