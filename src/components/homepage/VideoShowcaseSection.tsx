import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TableProperties, Lock, ExternalLink, Play } from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';
const VideoShowcaseSection = () => {
  const demoVideoId = "-A_9vymYngU"; // Your actual YouTube video ID
  const videoTitle = "Grace OS Complete Demo - Restaurant Management System";
  return <section className="container mx-auto px-4 py-8 sm:py-12">
      {/* Main video showcase */}
      <div className="max-w-5xl mx-auto mb-6 sm:mb-8">
        <YouTubeEmbed videoId={demoVideoId} title={videoTitle} className="mb-4" />
        
        {/* Video description and CTA */}
        <div className="text-center space-y-3">
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            <Badge variant="secondary" className="bg-grace-primary/10 text-grace-primary">
              <Play className="w-3 h-3 mr-1" />
              Product Demo
            </Badge>
            <Badge variant="secondary">Live System</Badge>
            <Badge variant="secondary">Real Features</Badge>
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Our development so far | July 2025</h3>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto mb-4">This comprehensive demo walks through our reservations system for hospitality, from table bookings and guest management to real-time analytics and payment processing.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button size="default" className="text-sm px-6 py-2" onClick={() => window.open(`https://www.youtube.com/watch?v=${demoVideoId}`, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Watch on YouTube
            </Button>
          </div>
        </div>
      </div>
    </section>;
};
export default VideoShowcaseSection;