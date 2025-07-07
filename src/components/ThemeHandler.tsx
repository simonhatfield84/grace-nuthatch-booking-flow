
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ThemeHandler() {
  const location = useLocation();
  
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Clear all theme classes and attributes
    root.classList.remove("light", "dark");
    body.classList.remove("light", "dark");
    root.removeAttribute('data-theme');
    body.removeAttribute('data-theme');

    // FORCE LIGHT THEME FOR ALL ROUTES - SIMPLIFIED APPROACH
    root.classList.add("light");
    body.classList.add("light");
    root.setAttribute('data-theme', 'light');
    
    // Set explicit background colors as fallback
    root.style.backgroundColor = '#F4EAE0';
    body.style.backgroundColor = '#F4EAE0';
    root.style.color = '#2E2E2E';
    body.style.color = '#2E2E2E';
    
    console.log('🎨 SIMPLIFIED THEME APPLIED:', {
      route: location.pathname,
      rootClasses: root.className,
      bodyClasses: body.className,
      rootBg: root.style.backgroundColor,
      bodyBg: body.style.backgroundColor,
      isIPad: navigator.userAgent.includes('iPad') || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    });

    // Force immediate repaint
    requestAnimationFrame(() => {
      root.offsetHeight;
      body.offsetHeight;
      console.log('🔄 Theme repaint completed');
    });

  }, [location.pathname]);

  return null;
}
