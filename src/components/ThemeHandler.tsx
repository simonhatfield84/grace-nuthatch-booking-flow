
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

      // FORCE LIGHT THEME FOR ALL ROUTES
      root.classList.add("light");
      body.classList.add("light");
      root.setAttribute('data-theme', 'light');
      
      // Store theme consistently with App.tsx
      localStorage.setItem('grace-ui-theme', 'light');
      
      console.log('🎨 Theme Applied Successfully:', {
        route: location.pathname,
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
      document.documentElement.style.backgroundColor = '#F4EAE0';
      document.documentElement.style.color = '#2E2E2E';
      document.body.style.backgroundColor = '#F4EAE0';
      document.body.style.color = '#2E2E2E';
    }

  }, [location.pathname]);

  return null;
}
