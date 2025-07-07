
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

    // TEMPORARILY APPLY LIGHT THEME TO ALL ROUTES FOR DEBUGGING
    // This will help us isolate if the issue is theme-related
    root.classList.add("light");
    body.classList.add("light");
    root.setAttribute('data-theme', 'light');
    
    console.log('🎨 FORCE LIGHT THEME APPLIED - Route:', location.pathname);
    console.log('🎨 Root classes:', root.className);
    console.log('🎨 Body classes:', body.className);

    // Add iPad-specific debugging
    const isIPad = navigator.userAgent.includes('iPad') || 
                   (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    
    if (isIPad) {
      console.log('📱 iPad detected - applying iPad-specific fixes');
      
      // Force immediate style recalculation
      root.style.backgroundColor = '#F4EAE0'; // Light theme background
      body.style.backgroundColor = '#F4EAE0';
      
      // Add iPad-specific class
      root.classList.add('ipad-safari');
      
      // Log computed styles
      const computedStyle = window.getComputedStyle(root);
      console.log('📱 iPad computed background:', computedStyle.backgroundColor);
      console.log('📱 iPad computed color:', computedStyle.color);
    }

    // Force repaint with requestAnimationFrame
    requestAnimationFrame(() => {
      // Trigger reflow
      root.offsetHeight;
      body.offsetHeight;
      
      console.log('🔄 Forced repaint completed');
      
      // Double-check styles after repaint
      const finalBg = window.getComputedStyle(root).backgroundColor;
      const finalColor = window.getComputedStyle(root).color;
      console.log('🎨 Final background:', finalBg);
      console.log('🎨 Final color:', finalColor);
    });

  }, [location.pathname]);

  return null;
}
