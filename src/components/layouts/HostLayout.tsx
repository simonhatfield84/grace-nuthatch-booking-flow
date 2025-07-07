
import React from "react";

interface HostLayoutProps {
  children: React.ReactNode;
}

export const HostLayout = ({ children }: HostLayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
};
