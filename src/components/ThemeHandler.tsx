
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ThemeHandler() {
  const location = useLocation();
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    // Determine app theme based on route
    const appTheme = location.pathname.startsWith('/host') ? 'host' : 'admin';

    if (appTheme === "host") {
      // Host interface always uses dark theme
      root.classList.add("dark");
    } else {
      // Admin interface uses light theme
      root.classList.add("light");
    }
  }, [location.pathname]);

  return null;
}
