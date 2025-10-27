interface HeroSectionProps {
  images: Array<{
    type: string;
    path: string;
    variants?: Array<{ w: number; h: number; path: string }>;
  }>;
}

export function HeroSection({ images }: HeroSectionProps) {
  if (!images || images.length === 0) return null;
  
  const heroImage = images[0];
  const imageSrc = heroImage.variants?.[0]?.path || heroImage.path;
  
  return (
    <div className="w-full h-48 md:h-64 overflow-hidden">
      <img 
        src={imageSrc} 
        alt="Venue" 
        className="w-full h-full object-cover"
      />
    </div>
  );
}
