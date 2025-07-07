
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ThemeHandler() {
  const location = useLocation();
  
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Clear all theme classes
    root.classList.remove("light", "dark");
    body.classList.remove("light", "dark");
    
    // Force removal of any lingering theme attributes
    root.removeAttribute('data-theme');
    body.removeAttribute('data-theme');

    // Determine app theme based on route
    const isHostRoute = location.pathname.startsWith('/host');

    if (isHostRoute) {
      // Host interface uses dark theme
      root.classList.add("dark");
      body.classList.add("dark");
      root.setAttribute('data-theme', 'dark');
      console.log('🎨 Applied DARK theme for host route:', location.pathname);
    } else {
      // All other routes use light theme
      root.classList.add("light");
      body.classList.add("light");
      root.setAttribute('data-theme', 'light');
      console.log('🎨 Applied LIGHT theme for route:', location.pathname);
    }

    // Force CSS recalculation for iPad Safari
    if (typeof window !== 'undefined') {
      // Trigger a repaint
      const forceRepaint = () => {
        const elements = [root, body];
        elements.forEach(el => {
          const display = el.style.display;
          el.style.display = 'none';
          el.offsetHeight; // Trigger reflow
          el.style.display = display;
        });
      };
      
      // Use requestAnimationFrame to ensure smooth transition
      requestAnimationFrame(() => {
        forceRepaint();
        console.log('🔄 Forced repaint for theme change');
      });
    }

    // Log current computed styles for debugging
    const computedBg = window.getComputedStyle(root).getPropertyValue('--background');
    const computedFg = window.getComputedStyle(root).getPropertyValue('--foreground');
    console.log('🎨 Theme values:', { 
      route: location.pathname, 
      isHost: isHostRoute,
      background: computedBg.trim(),
      foreground: computedFg.trim(),
      rootClasses: root.className,
      bodyClasses: body.className
    });

  }, [location.pathname]);

  return null;
}
