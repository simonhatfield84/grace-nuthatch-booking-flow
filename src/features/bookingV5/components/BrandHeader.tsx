import React from 'react';

interface BrandHeaderProps {
  logoUrl?: string;
  venueName: string;
  tagline?: string;
}

export function BrandHeader({ logoUrl, venueName, tagline }: BrandHeaderProps) {
  return (
    <div className="text-center py-6 border-b border-border" style={{ fontFamily: 'var(--font-heading)' }}>
      {logoUrl && (
        <img 
          src={logoUrl} 
          alt={venueName}
          className="h-16 mx-auto mb-3 object-contain"
        />
      )}
      <h1 className="text-2xl font-bold" style={{ color: 'var(--brand-primary, hsl(var(--foreground)))' }}>
        {venueName}
      </h1>
      {tagline && (
        <p className="text-sm text-muted-foreground mt-1">{tagline}</p>
      )}
    </div>
  );
}
