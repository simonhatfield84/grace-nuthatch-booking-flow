
import React from 'react';
import { useLocation } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';

interface SetupGuardProps {
  children: React.ReactNode;
}

export const SetupGuard = ({ children }: SetupGuardProps) => {
  const location = useLocation();

  // Check if the current path is /setup
  const isSetupPath = location.pathname === '/setup';

  // If we're already on the /setup page, just render the children
  if (isSetupPath) {
    return <>{children}</>;
  }

  // If we're not on the /setup page, use ProtectedRoute
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
};
