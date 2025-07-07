
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ThemeHandler() {
  const location = useLocation();
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    // Determine app theme based on route
    const isHostRoute = location.pathname.startsWith('/host');

    if (isHostRoute) {
      // Host interface uses dark theme
      root.classList.add("dark");
      console.log('🎨 Applied dark theme for host route:', location.pathname);
    } else {
      // All other routes use light theme
      root.classList.add("light");
      console.log('🎨 Applied light theme for route:', location.pathname);
    }
  }, [location.pathname]);

  return null;
}
