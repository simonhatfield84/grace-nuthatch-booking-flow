
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  TrendingUp,
  TableProperties,
  Lock,
  ExternalLink,
  Play
} from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';

const VideoShowcaseSection = () => {
  // Placeholder video ID - replace with your actual YouTube video ID
  const demoVideoId = "dQw4w9WgXcQ"; // Replace this with your actual video ID
  const videoTitle = "Grace OS Complete Demo - Restaurant Management System";

  return (
    <section className="container mx-auto px-4 py-12 sm:py-20">
      {/* SEO-optimized heading structure */}
      <header className="text-center mb-8 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          See Grace OS in Action
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Watch our complete product demonstration showcasing real venue management 
          features built through human-AI collaboration.
        </p>
      </header>

      {/* Main video showcase */}
      <div className="max-w-5xl mx-auto mb-8 sm:mb-12">
        <YouTubeEmbed
          videoId={demoVideoId}
          title={videoTitle}
          className="mb-6"
        />
        
        {/* Video description and CTA */}
        <div className="text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Badge variant="secondary" className="bg-grace-primary/10 text-grace-primary">
              <Play className="w-3 h-3 mr-1" />
              Product Demo
            </Badge>
            <Badge variant="secondary">Live System</Badge>
            <Badge variant="secondary">Real Features</Badge>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Complete Restaurant Management Solution
          </h3>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
            This comprehensive demo walks through our entire hospitality management system, 
            from table bookings and guest management to real-time analytics and payment processing. 
            Built collaboratively by Simon (20 years hospitality experience) and Fred (AI development partner).
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="text-base px-8 py-3"
              onClick={() => window.open(`https://www.youtube.com/watch?v=${demoVideoId}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Watch on YouTube
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => document.getElementById('journal')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Development Progress
            </Button>
          </div>
        </div>
      </div>

      {/* Key Features Summary - Enhanced for SEO */}
      <div className="border-t pt-8 sm:pt-12">
        <h3 className="text-xl font-semibold text-center mb-8 text-gray-900 dark:text-white">
          Core Features Demonstrated
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <Card className="text-center p-4 hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="p-2 sm:p-3 bg-grace-primary/10 rounded-lg mb-2 sm:mb-3 inline-block">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-grace-primary" />
              </div>
              <h4 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Real-time Bookings</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Instant synchronisation across all devices and staff members
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-4 hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="p-2 sm:p-3 bg-blue-600/10 rounded-lg mb-2 sm:mb-3 inline-block">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Smart Analytics</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                AI-powered insights to optimise venue operations and revenue
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-4 hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="p-2 sm:p-3 bg-green-600/10 rounded-lg mb-2 sm:mb-3 inline-block">
                <TableProperties className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Table Management</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Intuitive drag-and-drop interface that adapts to your layout
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-4 hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="p-2 sm:p-3 bg-purple-600/10 rounded-lg mb-2 sm:mb-3 inline-block">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Enterprise Security</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Bank-grade security with comprehensive audit trails
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default VideoShowcaseSection;
