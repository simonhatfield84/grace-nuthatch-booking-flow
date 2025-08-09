
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ThemeHandler() {
  const location = useLocation();
  
  useEffect(() => {
    try {
      const root = window.document.documentElement;
      const body = window.document.body;
      
      // Clear all theme classes and attributes
      root.classList.remove("light", "dark");
      body.classList.remove("light", "dark");
      root.removeAttribute('data-theme');
      body.removeAttribute('data-theme');

      // Determine theme based on route
      const isHostRoute = location.pathname.includes('/host');
      const theme = isHostRoute ? 'dark' : 'light';
      
      // Apply theme
      root.classList.add(theme);
      body.classList.add(theme);
      root.setAttribute('data-theme', theme);
      
      // Store theme consistently with App.tsx
      localStorage.setItem('grace-ui-theme', theme);
      
      console.log('🎨 Theme Applied Successfully:', {
        route: location.pathname,
        appliedTheme: theme,
        isHostRoute,
        rootClasses: root.className,
        bodyClasses: body.className,
        storageKey: localStorage.getItem('grace-ui-theme'),
        isIPad: navigator.userAgent.includes('iPad') || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
      });

      // Force immediate repaint
      requestAnimationFrame(() => {
        root.offsetHeight;
        body.offsetHeight;
        console.log('🔄 Theme repaint completed successfully');
      });

    } catch (error) {
      console.error('❌ Theme Handler Error:', error);
      // Fallback to basic styling if theme handler fails
      const fallbackBg = location.pathname.includes('/host') ? '#111315' : '#F4EAE0';
      const fallbackColor = location.pathname.includes('/host') ? '#FFFFFF' : '#2E2E2E';
      
      document.documentElement.style.backgroundColor = fallbackBg;
      document.documentElement.style.color = fallbackColor;
      document.body.style.backgroundColor = fallbackBg;
      document.body.style.color = fallbackColor;
    }

  }, [location.pathname]);

  return null;
}
