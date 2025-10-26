interface V4HeaderProps {
  logoUrl?: string;
  venueName: string;
  primaryColor?: string;
}

export function V4Header({ logoUrl, venueName, primaryColor }: V4HeaderProps) {
  return (
    <div className="mb-6 text-center">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={venueName}
          className="h-16 mx-auto mb-4 object-contain"
        />
      ) : (
        <h1 className="v4-heading text-3xl font-bold mb-2" style={{ color: primaryColor }}>
          {venueName}
        </h1>
      )}
    </div>
  );
}
