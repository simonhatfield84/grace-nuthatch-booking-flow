
import React, { useState, useEffect } from 'react';
import { Play, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  className?: string;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ 
  videoId, 
  title, 
  className = "" 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoaded) {
          setIsLoaded(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`youtube-${videoId}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [videoId, isLoaded]);

  const handlePlayClick = () => {
    setShowVideo(true);
  };

  const handleIframeError = () => {
    setHasError(true);
  };

  // Generate thumbnail URL
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  if (hasError) {
    return (
      <Card className={`flex items-center justify-center min-h-[300px] ${className}`}>
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Video Unavailable</h3>
          <p className="text-muted-foreground">
            Unable to load the demo video. Please try again later.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
          >
            Watch on YouTube
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div 
      id={`youtube-${videoId}`}
      className={`relative bg-black rounded-lg overflow-hidden shadow-lg ${className}`}
    >
      {!showVideo ? (
        // Thumbnail with play button
        <div className="relative aspect-video cursor-pointer group" onClick={handlePlayClick}>
          <img
            src={thumbnailUrl}
            alt={`${title} - Video Thumbnail`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setHasError(true)}
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="bg-grace-primary hover:bg-grace-primary/80 transition-colors rounded-full p-4 shadow-lg">
              <Play className="h-8 w-8 text-white ml-1" fill="currentColor" />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/70 backdrop-blur-sm rounded px-3 py-2">
              <p className="text-white font-medium text-sm">{title}</p>
              <p className="text-gray-300 text-xs">Click to play demo video</p>
            </div>
          </div>
        </div>
      ) : (
        // YouTube iframe
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            onError={handleIframeError}
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
};

export default YouTubeEmbed;
